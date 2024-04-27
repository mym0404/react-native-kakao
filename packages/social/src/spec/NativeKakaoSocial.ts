import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

export interface KakaoTalkProfile {
  /**
   * 카카오톡 닉네임
   *
   * 필요한 동의항목: 프로필 정보(닉네임/프로필 사진) 또는 닉네임
   */
  nickname?: string;
  /**
   * 사용자가 카카오톡을 이용 중인 국가
   *
   * @deprecated
   * @link https://devtalk.kakao.com/t/api-change-notice-response-fields-of-the-retrieving-kakao-talk-kakao-story-api/115151
   */
  countryISO?: string;
  /**
   * 카카오톡 프로필 이미지 URL
   * 640px * 640px 크기, HTTPS만 지원
   *
   * 필요한 동의항목: 프로필 정보(닉네임/프로필 사진) 또는 프로필 사진
   */
  profileImageUrl?: string;
  /**
   * 카카오톡 프로필 썸네일(Thumbnail) 이미지 URL
   * 110px * 110px 크기, HTTPS만 지원
   *
   * 필요한 동의항목: 프로필 정보(닉네임/프로필 사진) 또는 프로필 사진
   */
  thumbnailUrl?: string;
}
export interface KakaoTalkFriendSelectResult {
  totalCount: number;
  users: KakaoTalkFriendProfile[];
}
export interface KakaoTalkFriendProfile {
  /**
   * 해당 앱에서의 사용자 식별 코드 연결 상태와 관계 없으며 일반적으로 메시지 전송 시 사용 카카오톡을 탈퇴하거나
   * 새로 가입할 경우 값이 변경될 수 있음 사용자의 계정 상태에 따라 바뀔 수 있으므로, 앱에서 사용자 식별자로 사용하는 것을 권장하지 않음
   */
  uuid: string;
  /** 친구의 회원번호, 앱과 연결된 친구에게만 존재 */
  id?: number;
  /** 즐겨찾기 추가 여부, 채팅방 피커에서는 미제공 */
  favorite?: boolean;
  /** 프로필 닉네임, 프로필 닉네임 동의 항목에 동의하지 않은 친구나 앱과 연결되지 않는 친구의 경우,
   * 닉네임을 마스킹 처리하여 제공(닉네임 원본을 받으려면 권한 및 displayAllProfile 설정 필요) */
  profileNickname?: string;
  /**
   * 프로필 썸네일 이미지, 프로필 썸네일 이미지 동의 항목에 동의하지 않은 친구나 앱과 연결되지 않은 친구의 경우,
   * 프로필 이미지 미제공(프로필 이미지를 받으려면 권한 및 displayAllProfile 설정 필요)
   */
  profileThumbnailImage?: string;
}
export interface KakaoTalkFriendSelectOptions {
  /** 친구 피커의 이름 */
  title?: string;
  /** 친구 피커 테마 */
  viewAppearance?: 'auto' | 'light' | 'dark';
  /** 친구 피커의 기기 방향 */
  orientation?: 'auto' | 'landscape' | 'portrait';
  /** 친구 검색 기능 사용 여부 */
  enableSearch?: boolean;
  /** 내 프로필 표시 여부 */
  showMyProfile?: boolean;
  /** 즐겨찾기 친구 표시 여부 */
  showFavorite?: boolean;
  /** 선택한 친구 표시 여부 (멀티 피커에만 사용 가능) */
  showPickedFriend?: boolean;
  /** 선택 가능한 친구 수의 최대값 (멀티 피커에만 사용 가능) */
  maxPickableCount?: number;
  /** 선택 가능한 친구 수의 최소값 (멀티 피커에만 사용 가능) */
  minPickableCount?: number;
}

export interface KakaoTalkGetFriendsResult {
  totalCount: number;
  favoriteCount?: number;
  friends: KakaoTalkFriend[];
}
/**
 * 카카오톡 친구
 *
 * @property id 회원번호
 * @property uuid 메시지를 전송하기 위한 고유 아이디. 사용자의 계정 상태에 따라 이 정보는 바뀔 수 있으므로 앱내의 사용자 식별자로는 권장하지 않음.
 * @property profileNickname 친구의 닉네임
 * @property profileThumbnailImage 썸네일 이미지 URL
 * @property favorite 즐겨찾기 추가 여부
 * @property allowedMsg 메시지 수신이 허용되었는지 여부. 앱가입 친구의 경우는 feed msg 에 해당. 앱미가입친구는 invite msg 에 해당
 */
export interface KakaoTalkFriend {
  id?: number;
  uuid: string;
  profileNickname: string;
  profileThumbnailImage?: string;
  favorite?: boolean;
  allowedMsg?: boolean;
}
export interface KakaoTalkGetFriendsOptions {
  offset?: number;
  limit?: number;
  order?: 'asc' | 'desc';
  friendOrder?: 'nickname' | 'age' | 'favorite';
}

export interface Spec extends TurboModule {
  getProfile(): Promise<KakaoTalkProfile>;
  selectFriends(
    multiple: boolean,
    mode: string,
    options: UnsafeObject,
  ): Promise<KakaoTalkFriendSelectResult>;
  getFriends(options: UnsafeObject): Promise<KakaoTalkGetFriendsResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoSocial');
