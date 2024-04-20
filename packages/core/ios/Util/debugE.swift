//
//  Utils.swift
//  RNCKakaoCore
//
//  Created by mj on 4/20/24.
//

import Foundation

public func debugE(_ msg : Any...){
#if DEBUG
  if msg.count == 0{
    print("🧩",msg,"🧩")
  }else{
    var msgs = ""
    for i in msg{
      msgs += "\(i) "
    }
    print("🧩",msgs,"🧩")
  }
#endif
}
