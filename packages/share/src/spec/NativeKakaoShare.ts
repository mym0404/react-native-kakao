import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Int32, UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

/**
 * 메시지에서 콘텐츠 영역이나 버튼 클릭 시에 이동되는 링크 정보 오브젝트.
 *
 * @param webUrl PC 버전 카카오톡에서 사용하는 웹 링크 URL.
 * @param mobileWebUrl 모바일 카카오톡에서 사용하는 웹 링크 URL.
 * @param androidExecutionParams 안드로이드 카카오톡에서 사용하는 앱 링크 URL에 추가할 파라미터.
 * @param iosExecutionParams iOS 카카오톡에서 사용하는 앱 링크 URL에 추가할 파라미터.
 */
export interface KakaoTemplateLink {
  webUrl?: string;
  mobileWebUrl?: string;
  iosExecutionParams?: Readonly<{ [key: string]: string }>;
  androidExecutionParams?: Readonly<{ [key: string]: string }>;
}

/**
 * 콘텐츠의 내용을 담고 있는 오브젝트.
 *
 * @param title 콘텐츠의 타이틀
 * @param imageUrl 콘텐츠의 이미지 URL
 * @param link 콘텐츠 클릭 시 이동할 링크 정보
 * @param imageWidth 콘텐츠의 이미지 너비 (단위: 픽셀)
 * @param imageHeight 콘텐츠의 이미지 높이 (단위: 픽셀)
 */
export interface KakaoTemplateContent {
  title: string;
  imageUrl: string;
  link: KakaoTemplateLink;
  description?: string;
  imageWidth?: number;
  imageHeight?: number;
}

/**
 * 아이템 목록 형태의 콘텐츠의 내용을 담고 있는 오브젝트.
 *
 * @param item 아이템 이름. 최대 6자까지 출력
 * @param itemOp 아이템 가격. 사용 가능한 문자: 숫자, 통화기호, 쉼표(,), 마침표(.), 띄어쓰기 소수 단위 금액을 포함한 경우, 소수점 아래 2자리까지만 사용 권장.
 */
export interface KakaoTemplateItemInfo {
  item: string;
  itemOp: string;
}

/**
 * 아이템 목록 형태의 콘텐츠의 내용을 담고 있는 오브젝트.
 *
 * @param profileText 헤더 또는 프로필 영역에 출력될 텍스트. [profileImageUrl] 값이 없을 경우, 볼드(Bold)체로 된 제목만 담은 헤더 형태로 출력됨, 최대 16자까지 출력
 * @param profileImageUrl 프로필 영역에 출력될 이미지. 작은 원형의 프로필 사진 형태로 출력됨
 * @param titleImageText 이미지 아이템의 제목. 최대 2줄, 최대 24자까지 출력
 * @param titleImageUrl 이미지 아이템의 이미지. iOS 108*108, Android 98*98 크기 1:1 비율이 아닌 이미지는 센터 크롭(Center crop) 방식으로 재조정됨
 * @param titleImageCategory 이미지 아이템의 제목 아래에 회색 글씨로 출력되는 카테고리 정보. 최대 한 줄, 최대 14자까지 출력
 * @param items 각 텍스트 아이템 정보. 아이템 이름과 가격에 해당하는 [ItemInfo.item], [ItemInfo.itemOp]를 포함한 JSON 배열, 최대 5개의 아이템 지원
 * @param sum 주문금액, 결제금액 등 아이템 영역의 요약 정보 제목. 텍스트 아이템 영역 아래에 최대 6자까지 출력
 * @param sumOp 아이템 영역의 가격 합산 정보.텍스트 아이템 영역 아래에 볼드체로 최대 11자까지 출력
 */
export interface KakaoTemplateItemContent {
  profileText?: string;
  profileImageUrl?: string;
  titleImageText?: string;
  titleImageUrl?: string;
  titleImageCategory?: string;
  items?: Array<KakaoTemplateItemInfo>;
  sum?: string;
  sumOp?: string;
}

/**
 * 좋아요 수, 댓글 수 등의 소셜 정보를 표현하기 위해 사용되는 오브젝트.
 * @param likeCount 콘텐츠의 좋아요 수
 * @param commentCount 콘텐츠의 댓글 수
 * @param sharedCount 콘텐츠의 공유 수
 * @param viewCount 콘텐츠의 조회 수
 * @param subscriberCount 콘텐츠의 구독 수
 */
export interface KakaoTemplateSocial {
  likeCount?: Int32;
  commentCount?: Int32;
  sharedCount?: Int32;
  viewCount?: Int32;
  subscriberCount?: Int32;
}

/**
 * 가격 정보를 표현하기 위해 사용되는 오브젝트.
 *
 * @param regularPrice 정상가격
 * @param discountPrice 할인된 가격
 * @param discountRate 할인율
 * @param fixedDiscountPrice 정액 할인 가격
 * @param productName 상품명
 * @param currencyUnit 가격 단위
 * @param currencyUnitPosition 가격 단위 위치 (0: 가격뒤에 단위 표시, 1 : 가격앞에 단위 표시)
 */
export interface KakaoTemplateCommerce {
  regularPrice: Int32;
  discountPrice?: Int32;
  fixedDiscountPrice?: Int32;
  discountRate?: Int32;
  productName?: string;
  currencyUnit?: string;
  currencyUnitPosition?: Int32;
}

/**
 * 메시지 하단에 추가되는 버튼 오브젝트.
 *
 * @param title 버튼의 타이틀
 * @param link 버튼 클릭 시 이동할 링크 정보
 */
export interface KakaoTemplateButton {
  title: string;
  link: KakaoTemplateLink;
}

/**
 * 기본 템플릿으로 제공되는 피드 템플릿 클래스.
 *
 * @property content 메시지의 메인 콘텐츠 정보
 * @property itemContent 아이템 영역에 포함할 콘텐츠, [ItemContent] 참고
 * @property social 콘텐츠에 대한 소셜 정보
 * @property buttons 버튼 목록, 최대 2개. 버튼 타이틀과 링크를 변경하고 싶을 때, 버튼 두 개를 넣고 싶을 때 사용
 * @property buttonTitle 기본 버튼 타이틀(자세히 보기)을 변경하고 싶을 때 설정. 이 값을 사용하면 클릭 시 이동할 링크는 content 에 입력된 값이 사용됨.
 */
export interface KakaoFeedTemplate {
  content: KakaoTemplateContent;
  itemContent?: KakaoTemplateItemContent;
  social?: KakaoTemplateSocial;
  buttons?: KakaoTemplateButton[];
  buttonTitle?: string;
}

/**
 * 여러 개의 컨텐츠를 리스트 형태로 보여줄 수 있는 메시지 템플릿 클래스.
 *
 * @property headerTitle 리스트 상단에 노출되는 헤더 타이틀 (최대 200자)
 * @property headerLink 헤더 타이틀 내용에 해당하는 링크 정보
 * @property contents 리스트에 노출되는 컨텐츠 목록 (최소 2개, 최대 3개)
 * @property buttons 버튼 목록. 버튼 타이틀과 링크를 변경하고 싶을때, 버튼 두개를 사용하고 싶을때 사용. (최대 2개)
 * @property buttonTitle 기본 버튼 타이틀(자세히 보기)을 변경하고 싶을 때 설정. 이 값을 사용하면 클릭 시 이동할 링크는 content 에 입력된 값이 사용됨.
 */
export interface KakaoListTemplate {
  headerTitle: string;
  headerLink: KakaoTemplateLink;
  contents: KakaoTemplateContent[];
  buttons?: KakaoTemplateButton[];
  buttonTitle?: string;
}

/**
 * 주소를 이용하여 특정 위치를 공유할 수 있는 메시지 템플릿.
 *
 * @property address 공유할 위치의 주소. 예) 경기 성남시 분당구 판교역로 235
 * @property addressTitle 카카오톡 내의 지도 뷰에서 사용되는 타이틀. 예) 카카오판교오피스
 * @property content 위치에 대해 설명하는 컨텐츠 정보
 * @property social 댓글수, 좋아요수 등, 컨텐츠에 대한 소셜 정보
 * @property buttons 버튼 목록. 기본 버튼의 타이틀 외에 링크도 변경하고 싶을 때 설정. (최대 1개, 오른쪽 위치 보기 버튼은 고정)
 * @property buttonTitle 기본 버튼 타이틀(자세히 보기)을 변경하고 싶을 때 설정. 이 값을 사용하면 클릭 시 이동할 링크는 content에 입력된 값이 사용됨.
 */
export interface KakaoLocationTemplate {
  address: string;
  content: KakaoTemplateContent;
  addressTitle?: string;
  social?: KakaoTemplateSocial;
  buttons?: KakaoTemplateButton[];
  buttonTitle?: string;
}

/**
 * 기본 템플릿으로 제공되는 커머스 템플릿 클래스
 *
 * @property content 메시지의 내용. 텍스트 및 이미지, 링크 정보 포함.
 * @property commerce 컨텐츠에 대한 가격 정보
 * @property buttons 버튼 목록. 버튼 타이틀과 링크를 변경하고 싶을때, 버튼 두개를 사용하고 싶을때 사용. (최대 2개)
 * @property buttonTitle 기본 버튼 타이틀(자세히 보기)을 변경하고 싶을 때 설정. 이 값을 사용하면 클릭 시 이동할 링크는 content 에 입력된 값이 사용됨.
 */
export interface KakaoCommerceTemplate {
  content: KakaoTemplateContent;
  commerce: KakaoTemplateCommerce;
  buttons?: KakaoTemplateButton[];
  buttonTitle?: string;
}

/**
 * 텍스트형 기본 템플릿 클래스
 *
 * @property text 메시지에 들어갈 텍스트 (최대 200자)
 * @property link 컨텐츠 클릭 시 이동할 링크 정보
 * @property buttons 버튼 목록. 버튼 타이틀과 링크를 변경하고 싶을때, 버튼 두개를 사용하고 싶을때 사용. (최대 2개)
 * @property buttonTitle 기본 버튼 타이틀(자세히 보기)을 변경하고 싶을 때 설정. 이 값을 사용하면 클릭 시 이동할 링크는 content에 입력된 값이 사용됨.
 */
export interface KakaoTextTemplate {
  text: string;
  link: KakaoTemplateLink;
  buttons?: KakaoTemplateButton[];
  buttonTitle?: string;
}

/**
 * 톡캘린더의 구독 캘린더 또는 공개 일정 정보를 포함한 메시지 형식입니다.
 * 카카오톡 채널의 구독 캘린더 또는 공개 일정을 사용자의 톡캘린더에 추가하는 기능을 제공합니다.
 *
 * @property id 구독 캘린더 또는 공개 일정 ID
 * @property idType id의 타입, event(공개 일정) 또는 calendar(구독 캘린더) 중 하나
 * @property content 일정에 대해 설명하는 컨텐츠 정보
 * @property buttons 버튼 목록. 기본 버튼의 타이틀 외에 링크도 변경하고 싶을 때 설정. (최대 1개, 오른쪽 위치 보기 버튼은 고정)
 */
export interface KakaoCalendarTemplate {
  id: string;
  idType: 'event' | 'calendar';
  content: KakaoTemplateContent;
  buttons?: KakaoTemplateButton[];
}

export interface Spec extends TurboModule {
  shareOrSendMeOrSendFriendOrWhatever(
    /* share, send-me, send-friend */
    sendType: string,
    /* custom, feed, list, location, commerce, text, calendar */
    templateType: string,
    /* only for custom */
    templateId: Int32,
    /* only for default templates */
    templateJson: UnsafeObject,
    /* only for pass friend uuid directly */
    receiverUuids: ReadonlyArray<string>,
    useWebBrowserIfKakaoTalkNotAvailable: boolean,
    templateArgs: Readonly<{ [key: string]: string }>,
    serverCallbackArgs: Readonly<{ [key: string]: string }>,
  ): Promise<any>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoShare');
