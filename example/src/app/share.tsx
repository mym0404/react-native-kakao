import { showMessage } from 'react-native-flash-message';
import {
  type KakaoCommerceTemplate,
  type KakaoFeedTemplate,
  type KakaoListTemplate,
  type KakaoLocationTemplate,
  type KakaoTemplateContent,
  type KakaoTemplateLink,
  type KakaoTemplateSocial,
  type KakaoTextTemplate,
  sendCalendarTemplateToFriends,
  sendCalendarTemplateToMe,
  sendCommerceTemplateToFriends,
  sendCommerceTemplateToMe,
  sendCustomTemplateToFriends,
  sendCustomTemplateToMe,
  sendFeedTemplateToFriends,
  sendFeedTemplateToMe,
  sendListTemplateToFriends,
  sendListTemplateToMe,
  sendLocationTemplateToFriends,
  sendLocationTemplateToMe,
  sendTextTemplateToFriends,
  sendTextTemplateToMe,
  shareCalendarTemplate,
  shareCommerceTemplate,
  shareCustomTemplate,
  shareFeedTemplate,
  shareListTemplate,
  shareLocationTemplate,
  shareTextTemplate,
} from '@react-native-kakao/share';
import type { KakaoCalendarTemplate } from '@react-native-kakao/share/lib/typescript/src/spec/NativeKakaoShare';
import { selectMultipleFriends } from '@react-native-kakao/social';

import { Btn } from '../component/Btn';
import { StyledScrollView } from '../component/StyledScrollView';
import { Txt } from '../component/Txt';

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

const feed: KakaoFeedTemplate = {
  content,
  social,
  buttons: [
    {
      title: '앱에서 보기',
      link,
    },
  ],
};

const list: KakaoListTemplate = {
  contents: [content, content2],
  headerLink: link,
  headerTitle: 'Header',
  buttons: [
    {
      title: '앱에서 보기',
      link,
    },
  ],
};

const location: KakaoLocationTemplate = {
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
};

const commerce: KakaoCommerceTemplate = {
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
};

const text: KakaoTextTemplate = {
  text: 'text',
  link,
  buttons: [
    {
      title: '앱에서 보기',
      link,
    },
  ],
};

const calendar: KakaoCalendarTemplate = {
  id: 'id',
  content,
  idType: 'event',
  buttons: [
    {
      title: '앱에서 보기',
      link,
    },
  ],
};

export default function Page() {
  return (
    <StyledScrollView
      flex={1}
      contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4, gap: 4 }}
    >
      <Txt>{'Custom'}</Txt>
      <Btn
        title={'Share Custom Template'}
        onPress={() => {
          shareCustomTemplate({
            templateId: 107429,
            templateArgs: {
              price: '20000',
            },
            serverCallbackArgs: {},
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <Btn
        title={'Send Custom Template To Me'}
        onPress={() => {
          sendCustomTemplateToMe({
            templateId: 107430,
            templateArgs: {
              price: '20000',
            },
          })
            .then(console.log)
            .catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <Btn
        title={'Send Custom Template To Friends'}
        onPress={async () => {
          const { users } = await selectMultipleFriends({ mode: 'popup' });
          const ret = await sendCustomTemplateToFriends({
            templateId: 107430,
            templateArgs: {
              price: '20000',
            },
            receiverUuids: users.map((u) => u.uuid),
          });
          console.log(ret);
        }}
      />
      <Txt>{'Feed'}</Txt>
      <Btn
        title={'Share Feed Template'}
        onPress={() => {
          shareFeedTemplate({
            template: feed,
            serverCallbackArgs: {},
          });
        }}
      />
      <Btn
        title={'Send Feed Template To Me'}
        onPress={() => {
          sendFeedTemplateToMe({
            template: feed,
          });
        }}
      />
      <Btn
        title={'Send Feed Template To Friends'}
        onPress={async () => {
          const { users } = await selectMultipleFriends({ mode: 'popup' });
          await sendFeedTemplateToFriends({
            template: feed,
            receiverUuids: users.map((u) => u.uuid),
          });
        }}
      />
      <Txt>{'List'}</Txt>
      <Btn
        title={'Share List Template'}
        onPress={() => {
          shareListTemplate({
            template: list,
            serverCallbackArgs: {},
          });
        }}
      />
      <Btn
        title={'Send List Template To Me'}
        onPress={() => {
          sendListTemplateToMe({
            template: list,
          });
        }}
      />
      <Btn
        title={'Send List Template To Friends'}
        onPress={async () => {
          const { users } = await selectMultipleFriends({ mode: 'popup' });
          await sendListTemplateToFriends({
            template: list,
            receiverUuids: users.map((u) => u.uuid),
          });
        }}
      />
      <Txt>{'Location'}</Txt>
      <Btn
        title={'Share Location Template'}
        onPress={() => {
          shareLocationTemplate({
            template: location,
            serverCallbackArgs: {},
          });
        }}
      />
      <Btn
        title={'Send Location Template To Me'}
        onPress={() => {
          sendLocationTemplateToMe({
            template: location,
          });
        }}
      />
      <Btn
        title={'Send Location Template To Friends'}
        onPress={async () => {
          const { users } = await selectMultipleFriends({ mode: 'popup' });
          await sendLocationTemplateToFriends({
            template: location,
            receiverUuids: users.map((u) => u.uuid),
          });
        }}
      />
      <Txt>{'Commerce'}</Txt>
      <Btn
        title={'Share Commerce Template'}
        onPress={() => {
          shareCommerceTemplate({
            template: commerce,
            serverCallbackArgs: {},
          });
        }}
      />
      <Btn
        title={'Send Commerce Template To Me'}
        onPress={() => {
          sendCommerceTemplateToMe({
            template: commerce,
          });
        }}
      />
      <Btn
        title={'Send Commerce Template To Friends'}
        onPress={async () => {
          const { users } = await selectMultipleFriends({ mode: 'popup' });
          await sendCommerceTemplateToFriends({
            template: commerce,
            receiverUuids: users.map((u) => u.uuid),
          });
        }}
      />
      <Txt>{'Text'}</Txt>
      <Btn
        title={'Share Text Template'}
        onPress={() => {
          shareTextTemplate({
            template: text,
            serverCallbackArgs: {},
          });
        }}
      />
      <Btn
        title={'Send Text Template To Me'}
        onPress={() => {
          sendTextTemplateToMe({
            template: text,
          });
        }}
      />
      <Btn
        title={'Send Text Template To Friends'}
        onPress={async () => {
          const { users } = await selectMultipleFriends({ mode: 'popup' });
          await sendTextTemplateToFriends({
            template: text,
            receiverUuids: users.map((u) => u.uuid),
          });
        }}
      />
      <Txt>{'Calendar'}</Txt>
      <Btn
        title={'Share Calender Template'}
        onPress={() => {
          shareCalendarTemplate({
            template: calendar,
            serverCallbackArgs: {},
          });
        }}
      />
      <Btn
        title={'Send Calendar Template To Me'}
        onPress={() => {
          sendCalendarTemplateToMe({
            template: calendar,
          });
        }}
      />
      <Btn
        title={'Send Calendar Template To Friends'}
        onPress={async () => {
          const { users } = await selectMultipleFriends({ mode: 'popup' });
          await sendCalendarTemplateToFriends({
            template: calendar,
            receiverUuids: users.map((u) => u.uuid),
          });
        }}
      />
    </StyledScrollView>
  );
}
