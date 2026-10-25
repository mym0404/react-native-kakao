import { useState } from 'react';
import { Platform, TextInput } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import {
  getShareTemplateDiagnostics,
  isKakaoTalkSharingAvailable,
  type KakaoCalendarTemplate,
  type KakaoCommerceTemplate,
  type KakaoDefaultTemplateParams,
  type KakaoFeedTemplate,
  type KakaoListTemplate,
  type KakaoLocationTemplate,
  type KakaoTemplateContent,
  type KakaoTemplateLink,
  type KakaoTemplateSocial,
  type KakaoTextTemplate,
  makeCustomTemplateUrl,
  makeDefaultTemplateUrl,
  makeScrapTemplateUrl,
  scrapImage,
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
  sendScrapTemplateToFriends,
  sendScrapTemplateToMe,
  sendTextTemplateToFriends,
  sendTextTemplateToMe,
  shareCalendarTemplate,
  shareCommerceTemplate,
  shareCustomTemplate,
  shareFeedTemplate,
  shareListTemplate,
  shareLocationTemplate,
  shareScrapTemplate,
  shareTextTemplate,
  uploadImage,
} from '@react-native-kakao/share';
import { selectMultipleFriends } from '@react-native-kakao/social';
import { Asset } from 'expo-asset';

import { Btn } from '../component/Btn';
import { E2EApiAction } from '../component/E2EApiAction';
import { StyledScrollView } from '../component/StyledScrollView';
import { Txt } from '../component/Txt';

const webUrl = 'https://rnkakao.mjstudio.net';
const uploadImageUri =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEUlEQVR4nGP4f4bhPwgzwBgAZhILKbl4g2kAAAAASUVORK5CYII=';

const scrapRequestUrl = 'https://rnkakao.mjstudio.net';
const kakaoLinkTemplateId = 107429;
const kakaoTalkMessageTemplateId = 107430;
const scrapTemplateArgs = { price: '20000' };
const scrapFriendPickerParams = {
  mode: 'full' as const,
  options: { showMyProfile: true },
};

const scrapImageUrl =
  'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png';

const link: KakaoTemplateLink = {
  webUrl,
  mobileWebUrl: webUrl,
  iosExecutionParams: {},
  androidExecutionParams: {},
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

const urlVerificationText = 'URL & 한글';
const urlExecutionParams = { source: urlVerificationText, special: 'a=b&c?d#e%f', empty: '' };
const urlLink = {
  ...link,
  androidExecutionParams: urlExecutionParams,
  iosExecutionParams: urlExecutionParams,
};
const urlContent = { ...content, link: urlLink };
const urlServerCallbackArgs = { verification: urlVerificationText, empty: '' };
const defaultTemplateUrlCases: KakaoDefaultTemplateParams[] = [
  { templateType: 'feed', template: { ...feed, content: urlContent } },
  {
    templateType: 'list',
    template: { ...list, headerLink: urlLink, contents: [urlContent, content2] },
  },
  { templateType: 'location', template: { ...location, content: urlContent } },
  { templateType: 'commerce', template: { ...commerce, content: urlContent } },
  { templateType: 'text', template: { ...text, text: urlVerificationText, link: urlLink } },
  { templateType: 'calendar', template: { ...calendar, content: urlContent } },
];

async function sendDetailedMessage(templateType: 'text' | 'custom' | 'scrap') {
  const selected = await selectMultipleFriends(scrapFriendPickerParams);
  const params = {
    receiverUuids: selected.users.map(({ uuid }) => uuid),
    includeFailureInfo: true as const,
  };

  if (params.receiverUuids.length === 0) {
    return { selectedCount: 0 };
  }

  const result =
    templateType === 'text'
      ? await sendTextTemplateToFriends({
          ...params,
          template: {
            text: 'RNCExample message result verification',
            link: { webUrl: scrapRequestUrl, mobileWebUrl: scrapRequestUrl },
          },
        })
      : templateType === 'custom'
        ? await sendCustomTemplateToFriends({ ...params, templateId: kakaoTalkMessageTemplateId })
        : await sendScrapTemplateToFriends({ ...params, requestUrl: scrapRequestUrl });

  return {
    selectedCount: params.receiverUuids.length,
    successfulCount: result.successfulReceiverUuids.length,
    failureCount: result.failureInfos.reduce(
      (count, failure) => count + failure.receiverUuids.length,
      0,
    ),
    failureCodes: result.failureInfos.map((failure) => failure.code),
  };
}

export default function Page() {
  const [imageUri, setImageUri] = useState(uploadImageUri);

  return (
    <StyledScrollView
      flex={1}
      contentContainerSx={{ pt: 12, pb: 48, alignItems: 'center', px: 4, gap: 4 }}
    >
      <E2EApiAction
        id={'share-availability'}
        title={'Is Kakao Talk Sharing Available'}
        action={isKakaoTalkSharingAvailable}
      />
      {defaultTemplateUrlCases.map((params) => (
        <E2EApiAction
          key={params.templateType}
          id={`share-url-${params.templateType}`}
          title={`Build ${params.templateType} sharing URL`}
          action={() =>
            makeDefaultTemplateUrl({ ...params, serverCallbackArgs: urlServerCallbackArgs })
          }
        />
      ))}
      <E2EApiAction
        id={'share-url-custom'}
        title={'Build custom sharing URL'}
        action={() =>
          makeCustomTemplateUrl({
            templateId: kakaoLinkTemplateId,
            templateArgs: { ...scrapTemplateArgs, verification: urlVerificationText },
            serverCallbackArgs: urlServerCallbackArgs,
          })
        }
      />
      <E2EApiAction
        id={'share-url-scrap'}
        title={'Build scrap sharing URL'}
        action={() =>
          makeScrapTemplateUrl({
            requestUrl: `${scrapRequestUrl}/?source=${encodeURIComponent(urlVerificationText)}`,
            serverCallbackArgs: urlServerCallbackArgs,
          })
        }
      />
      <E2EApiAction
        id={'share-url-scrap-custom'}
        title={'Build custom scrap sharing URL'}
        action={() =>
          makeScrapTemplateUrl({
            requestUrl: scrapRequestUrl,
            templateId: kakaoLinkTemplateId,
            templateArgs: scrapTemplateArgs,
            serverCallbackArgs: urlServerCallbackArgs,
          })
        }
      />
      {defaultTemplateUrlCases.map((params) => (
        <E2EApiAction
          key={`diagnostics-${params.templateType}`}
          id={`share-diagnostics-${params.templateType}`}
          title={`Inspect ${params.templateType} template`}
          action={() => getShareTemplateDiagnostics(params)}
        />
      ))}
      <E2EApiAction
        id={'share-diagnostics-custom'}
        title={'Inspect custom template'}
        action={() =>
          getShareTemplateDiagnostics({
            templateType: 'custom',
            templateId: kakaoLinkTemplateId,
            templateArgs: scrapTemplateArgs,
            serverCallbackArgs: urlServerCallbackArgs,
            pickerSettings: { type: 'chat', limit: 2 },
          })
        }
      />
      <E2EApiAction
        id={'share-diagnostics-scrap'}
        title={'Inspect scrap template'}
        action={() =>
          getShareTemplateDiagnostics({ templateType: 'scrap', requestUrl: scrapRequestUrl })
        }
      />
      <E2EApiAction
        id={'share-diagnostics-scrap-custom'}
        title={'Inspect custom scrap template'}
        action={() =>
          getShareTemplateDiagnostics({
            templateType: 'scrap',
            requestUrl: scrapRequestUrl,
            templateId: kakaoLinkTemplateId,
            templateArgs: scrapTemplateArgs,
          })
        }
      />
      <E2EApiAction
        id={'share-diagnostics-invalid-template'}
        title={'Inspect invalid template ID'}
        action={() => getShareTemplateDiagnostics({ templateType: 'custom', templateId: -1 })}
      />
      <E2EApiAction
        id={'share-diagnostics-invalid-picker'}
        title={'Reject invalid diagnostic picker limit'}
        action={() =>
          getShareTemplateDiagnostics({
            templateType: 'text',
            template: text,
            pickerSettings: { limit: 0 },
          })
        }
      />
      <E2EApiAction
        id={'share-diagnostics-warning'}
        title={'Inspect unregistered link warning'}
        action={() =>
          getShareTemplateDiagnostics({
            templateType: 'text',
            template: { text: 'Diagnostic only', link: { webUrl: 'https://example.invalid' } },
          })
        }
      />
      <E2EApiAction
        id={'share-diagnostics-missing-args'}
        title={'Inspect missing custom arguments'}
        action={() =>
          getShareTemplateDiagnostics({ templateType: 'custom', templateId: kakaoLinkTemplateId })
        }
      />
      <E2EApiAction
        id={'share-picker-settings'}
        title={'Share Text with Chat Picker (Limit 2)'}
        action={() =>
          shareTextTemplate({ template: text, pickerSettings: { type: 'chat', limit: 2 } })
        }
      />
      <E2EApiAction
        id={'share-picker-invalid-limit'}
        title={'Reject Invalid Share Picker Limit'}
        action={() => shareTextTemplate({ template: text, pickerSettings: { limit: 0 } })}
      />
      <TextInput
        accessibilityLabel={'Image URI'}
        testID={'share-upload-image-uri'}
        value={imageUri}
        onChangeText={setImageUri}
        style={{ width: '100%', borderWidth: 1, padding: 8 }}
      />
      <E2EApiAction
        id={'share-upload-image'}
        title={'Upload Image'}
        action={() => uploadImage({ imageUri })}
      />
      <E2EApiAction
        id={'share-upload-image-http'}
        title={'Upload Image (HTTP)'}
        action={() => uploadImage({ imageUri, secureResource: false })}
      />
      <E2EApiAction
        id={'share-upload-image-invalid'}
        title={'Upload Invalid Image'}
        action={() => uploadImage({ imageUri: 'file:///missing-kakao-image.png' })}
      />
      {Platform.OS !== 'web' ? (
        <E2EApiAction
          id={'share-upload-image-file'}
          title={'Upload Local File'}
          action={async () => {
            const image = Asset.fromURI(scrapImageUrl);
            await image.downloadAsync();
            if (!image.localUri) {
              throw new Error('Image download did not create a local file');
            }

            setImageUri(image.localUri);

            return uploadImage({ imageUri: image.localUri });
          }}
        />
      ) : null}
      <Txt>{'Scrap'}</Txt>
      <E2EApiAction
        id={'share-scrap'}
        title={'Share Scrap Template'}
        action={async () => {
          await shareScrapTemplate({ requestUrl: webUrl });

          return { started: true };
        }}
      />
      <E2EApiAction
        id={'share-scrap-custom'}
        title={'Share Scrap With Template Arguments'}
        action={async () => {
          await shareScrapTemplate({
            requestUrl: webUrl,
            templateId: 107429,
            templateArgs: { price: '20000' },
            serverCallbackArgs: { verification: 'scrap' },
          });

          return { started: true };
        }}
      />
      <E2EApiAction
        id={'share-scrap-no-browser'}
        title={'Share Scrap Without Browser'}
        action={async () => {
          await shareScrapTemplate({
            requestUrl: webUrl,
            useWebBrowserIfKakaoTalkNotAvailable: false,
          });

          return { started: true };
        }}
      />
      <Txt>{'Message Results'}</Txt>
      <E2EApiAction
        id={'send-text-with-result'}
        title={'Send Text With Detailed Result'}
        action={() => sendDetailedMessage('text')}
      />
      <E2EApiAction
        id={'send-custom-with-result'}
        title={'Send Custom With Detailed Result'}
        action={() => sendDetailedMessage('custom')}
      />
      <E2EApiAction
        id={'send-scrap-with-result'}
        title={'Send Scrap With Detailed Result'}
        action={() => sendDetailedMessage('scrap')}
      />
      <Txt>{'Scrap Messages'}</Txt>
      <E2EApiAction
        id={'send-scrap-me'}
        title={'Send Scrap Template To Me'}
        action={async () => {
          await sendScrapTemplateToMe({ requestUrl: scrapRequestUrl });

          return { didSend: true };
        }}
      />
      <E2EApiAction
        id={'send-scrap-custom-me'}
        title={'Send Custom Scrap Template To Me'}
        action={async () => {
          await sendScrapTemplateToMe({
            requestUrl: scrapRequestUrl,
            templateId: kakaoLinkTemplateId,
            templateArgs: scrapTemplateArgs,
          });

          return { didSend: true };
        }}
      />
      <E2EApiAction
        id={'send-scrap-friends'}
        title={'Send Scrap Template To Selected Friends'}
        action={async () => {
          const { users } = await selectMultipleFriends(scrapFriendPickerParams);
          if (users.length === 0) {
            return { successfulCount: 0 };
          }

          const successfulUuids = await sendScrapTemplateToFriends({
            requestUrl: scrapRequestUrl,
            receiverUuids: users.map(({ uuid }) => uuid),
          });

          return { successfulCount: successfulUuids.length };
        }}
      />
      <E2EApiAction
        id={'send-scrap-custom-friends'}
        title={'Send Custom Scrap Template To Selected Friends'}
        action={async () => {
          const { users } = await selectMultipleFriends(scrapFriendPickerParams);
          if (users.length === 0) {
            return { successfulCount: 0 };
          }

          const successfulUuids = await sendScrapTemplateToFriends({
            requestUrl: scrapRequestUrl,
            templateId: kakaoTalkMessageTemplateId,
            templateArgs: scrapTemplateArgs,
            receiverUuids: users.map(({ uuid }) => uuid),
          });

          return { successfulCount: successfulUuids.length };
        }}
      />
      <E2EApiAction
        id={'share-scrap-image'}
        title={'Scrap Image'}
        action={() => scrapImage({ imageUrl: scrapImageUrl })}
      />
      <E2EApiAction
        id={'share-scrap-image-http'}
        title={'Scrap Image (HTTP)'}
        action={() => scrapImage({ imageUrl: scrapImageUrl, secureResource: false })}
      />
      <Txt>{'Custom'}</Txt>
      <Btn
        title={'Share Custom Template'}
        onPress={() => {
          shareCustomTemplate({
            templateId: kakaoLinkTemplateId,
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
            templateId: kakaoTalkMessageTemplateId,
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
            templateId: kakaoTalkMessageTemplateId,
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
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <Btn
        title={'Send Feed Template To Me'}
        onPress={() => {
          sendFeedTemplateToMe({
            template: feed,
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
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
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <Btn
        title={'Send List Template To Me'}
        onPress={() => {
          sendListTemplateToMe({
            template: list,
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
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
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <Btn
        title={'Send Location Template To Me'}
        onPress={() => {
          sendLocationTemplateToMe({
            template: location,
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
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
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <Btn
        title={'Send Commerce Template To Me'}
        onPress={() => {
          sendCommerceTemplateToMe({
            template: commerce,
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
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
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <Btn
        title={'Send Text Template To Me'}
        onPress={() => {
          sendTextTemplateToMe({
            template: text,
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
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
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
        }}
      />
      <Btn
        title={'Send Calendar Template To Me'}
        onPress={() => {
          sendCalendarTemplateToMe({
            template: calendar,
          }).catch((e) => showMessage({ type: 'warning', message: e.message }));
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
