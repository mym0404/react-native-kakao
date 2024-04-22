import {
  type KakaoTemplateContent,
  type KakaoTemplateLink,
  type KakaoTemplateSocial,
  shareCalendarTemplate,
  shareCommerceTemplate,
  shareCustom,
  shareFeedTemplate,
  shareListTemplate,
  shareLocationTemplate,
  shareTextTemplate,
} from '@react-native-kakao/share';

import { Btn } from '../component/Btn';
import { StyledScrollView } from '../component/StyledScrollView';

const link: KakaoTemplateLink = {
  webUrl: 'https://mjstudio.net',
  mobileWebUrl: 'https://mjstudio.net',
};

const social: KakaoTemplateSocial = {
  commentCount: 999,
  likeCount: 999,
  sharedCount: 999,
  subscriberCount: 999,
  viewCount: 999,
};

const content: KakaoTemplateContent = {
  imageUrl: 'https://picsum.photos/256/256',
  title: 'React Native Kakao',
  link: link,
  description: 'React Native Kakao is all in one solution of Kakao SDK in React Native',
  imageHeight: 256,
  imageWidth: 256,
};

const content2: KakaoTemplateContent = {
  imageUrl: 'https://picsum.photos/256/256',
  title: 'React Native Kakao2',
  link: link,
  description: 'React Native Kakao is all in one solution of Kakao SDK in React Native',
  imageHeight: 256,
  imageWidth: 256,
};

export default function Page() {
  return (
    <StyledScrollView
      flex={1}
      contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4, gap: 4 }}
    >
      <Btn
        title={'Share Custom Template'}
        onPress={() => {
          shareCustom({
            templateId: 107179,
            templateArgs: {
              price: '20000',
            },
            serverCallbackArgs: {},
          });
        }}
      />
      <Btn
        title={'Share Feed Template'}
        onPress={() => {
          shareFeedTemplate({
            template: {
              content,
              social,
              buttons: [
                {
                  title: '앱에서 보기',
                  link,
                },
              ],
            },
            serverCallbackArgs: {},
          });
        }}
      />
      <Btn
        title={'Share List Template'}
        onPress={() => {
          shareListTemplate({
            template: {
              contents: [content, content2],
              headerLink: link,
              headerTitle: 'Header',
              buttons: [
                {
                  title: '앱에서 보기',
                  link,
                },
              ],
            },
            serverCallbackArgs: {},
          });
        }}
      />
      <Btn
        title={'Share Location Template'}
        onPress={() => {
          shareLocationTemplate({
            template: {
              address: 'address',
              addressTitle: 'Title',
              content,
              social,
              buttons: [
                {
                  title: '앱에서 보기',
                  link,
                },
              ],
            },
            serverCallbackArgs: {},
          });
        }}
      />
      <Btn
        title={'Share Commerce Template'}
        onPress={() => {
          shareCommerceTemplate({
            template: {
              content,
              commerce: {
                productName: 'Product',
                currencyUnit: '원',
                discountPrice: 40,
                discountRate: 40,
                regularPrice: 10000,
              },
              buttons: [
                {
                  title: '앱에서 보기',
                  link,
                },
              ],
            },
            serverCallbackArgs: {},
          });
        }}
      />
      <Btn
        title={'Share Text Template'}
        onPress={() => {
          shareTextTemplate({
            template: {
              text: 'text',
              link,
              buttons: [
                {
                  title: '앱에서 보기',
                  link,
                },
              ],
            },
            serverCallbackArgs: {},
          });
        }}
      />
      <Btn
        title={'Share Calender Template'}
        onPress={() => {
          shareCalendarTemplate({
            template: {
              id: 'id',
              content,
              idType: 'event',
              buttons: [
                {
                  title: '앱에서 보기',
                  link,
                },
              ],
            },
            serverCallbackArgs: {},
          });
        }}
      />
    </StyledScrollView>
  );
}
