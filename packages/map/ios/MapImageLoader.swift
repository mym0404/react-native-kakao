import ExpoModulesCore
import UIKit

private let mapImageLoadError = "ERR_KAKAO_MAP_IMAGE_LOAD"
private let supportedMapImageSchemes = Set([
  "asset", "content", "data", "file", "http", "https"
])

final class MapImageLoadException: Exception {
  init(_ message: String) {
    super.init(name: "KakaoMapImageError", description: message, code: mapImageLoadError)
  }
}

final class MapImageLoadToken {
  fileprivate let id: UUID
  private let lock = NSLock()
  private var cancellation: (() -> Void)?
  private var isFinished = false

  fileprivate init(id: UUID = UUID(), cancellation: @escaping () -> Void) {
    self.id = id
    self.cancellation = cancellation
  }

  func cancel() {
    lock.lock()
    guard !isFinished else {
      lock.unlock()
      return
    }
    isFinished = true
    let cancellation = cancellation
    self.cancellation = nil
    lock.unlock()
    cancellation?()
  }

  @discardableResult
  fileprivate func finish() -> Bool {
    lock.lock()
    guard !isFinished else {
      lock.unlock()
      return false
    }
    isFinished = true
    cancellation = nil
    lock.unlock()
    return true
  }
}

final class MapImageLoader {
  private struct Request {
    let token: MapImageLoadToken
    let completion: (Result<UIImage, Error>) -> Void
  }

  private let imageLoader: EXImageLoaderInterface?
  private let cache = NSCache<NSURL, UIImage>()
  private var requests: [UUID: Request] = [:]
  private var isDisposed = false

  init(appContext: AppContext?) {
    imageLoader = appContext?.imageLoader
    cache.countLimit = 64
    cache.totalCostLimit = 16 * 1024 * 1024
  }

  @discardableResult
  func load(
    _ uri: String,
    completion: @escaping (Result<UIImage, Error>) -> Void
  ) -> MapImageLoadToken {
    dispatchPrecondition(condition: .onQueue(.main))
    let requestId = UUID()
    let token = MapImageLoadToken(id: requestId) { [weak self] in
      if Thread.isMainThread {
        self?.cancel(requestId)
      } else {
        DispatchQueue.main.async { [weak self] in
          self?.cancel(requestId)
        }
      }
    }

    guard !isDisposed else {
      fail(token, completion: completion, message: "The map image loader was destroyed.")
      return token
    }
    requests[token.id] = Request(token: token, completion: completion)
    guard let url = URL(string: uri), let scheme = url.scheme?.lowercased(),
          supportedMapImageSchemes.contains(scheme)
    else {
      reject(token.id, message: "Image URI must use a supported scheme.")
      return token
    }
    guard let imageLoader else {
      reject(token.id, message: "The Expo image loader is unavailable.")
      return token
    }

    let key = url as NSURL
    if let image = cache.object(forKey: key) {
      DispatchQueue.main.async { [weak self] in
        self?.finish(token.id, result: .success(image))
      }
      return token
    }

    imageLoader.loadImage(for: url) { [weak self] error, image in
      DispatchQueue.main.async { [weak self] in
        guard let self, !self.isDisposed else { return }
        if let image {
          finish(token.id, result: .success(image), cacheKey: key)
        } else {
          finish(
            token.id,
            result: .failure(MapImageLoadException(error?
                .localizedDescription ?? "Could not decode the map image."))
          )
        }
      }
    }
    return token
  }

  func dispose() {
    dispatchPrecondition(condition: .onQueue(.main))
    guard !isDisposed else { return }
    isDisposed = true
    let currentRequests = requests.values
    requests.removeAll()
    currentRequests.forEach { $0.token.finish() }
    cache.removeAllObjects()
  }

  private func cancel(_ id: UUID) {
    requests.removeValue(forKey: id)
  }

  private func finish(
    _ id: UUID,
    result: Result<UIImage, Error>,
    cacheKey: NSURL? = nil
  ) {
    guard !isDisposed, let request = requests.removeValue(forKey: id) else { return }
    guard request.token.finish() else { return }
    if case let .success(image) = result, let cacheKey {
      cache.setObject(image, forKey: cacheKey, cost: imageCost(image))
    }
    request.completion(result)
  }

  private func reject(_ id: UUID, message: String) {
    DispatchQueue.main.async { [weak self] in
      self?.finish(id, result: .failure(MapImageLoadException(message)))
    }
  }

  private func fail(
    _ token: MapImageLoadToken,
    completion: @escaping (Result<UIImage, Error>) -> Void,
    message: String
  ) {
    DispatchQueue.main.async {
      if token.finish() {
        completion(.failure(MapImageLoadException(message)))
      }
    }
  }
}

private func imageCost(_ image: UIImage) -> Int {
  guard let cgImage = image.cgImage else { return 0 }
  return cgImage.bytesPerRow * cgImage.height
}
