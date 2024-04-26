import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { UnsafeObject } from 'react-native/Libraries/Types/CodegenTypes';

export interface KakaoTalkProfile {
  nickname?: string;
  countryISO?: string;
  profileImageUrl?: string;
  thumbnailUrl?: string;
}
export interface KakaoTalkFriendSelectResult {
  totalCount: number;
  users: KakaoTalkFriendProfile[];
}
export interface KakaoTalkFriendProfile {
  uuid: string;
  id?: number;
  favorite?: boolean;
  profileNickname?: string;
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

export interface Spec extends TurboModule {
  getProfile(): Promise<KakaoTalkProfile>;
  selectFriends(
    multiple: boolean,
    mode: string,
    options: UnsafeObject,
  ): Promise<KakaoTalkFriendSelectResult>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNCKakaoSocial');
