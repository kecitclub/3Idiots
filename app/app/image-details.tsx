import { View, ScrollView, Pressable, ToastAndroid } from 'react-native';
import React from 'react';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import Text from '@/components/Text';
import { Image } from 'expo-image';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import PenIcon from '@/assets/icons/Pen.svg';
import GlobeIcon from '@/assets/icons/Globe.svg';
import StarIcon from '@/assets/icons/Star.svg';
import ClockIcon from '@/assets/icons/Clock.svg';
import LinkIcon from '@/assets/icons/Link.svg';
import MailIcon from '@/assets/icons/Mail.svg';
import EMAIL_TEMPLATE from '@/utils/EMAIL_TEMPLATE';
import { Resend } from 'resend';

const resend = new Resend('re_gi5HcfSW_GEsKg2WxnzVusAe3MaMgCghu');

export default function ImageDetails() {
  const { styles, theme } = useStyles(stylesheet);
  const params = useLocalSearchParams();

  async function sendTakedownRequest() {
    const websiteUrl = params.url as string;
    const imageUrls = params.image_url as string;
    const websiteName = params.website_name as string;

    const email = EMAIL_TEMPLATE(
      'Aman Chand',
      'amanchand012@gmail.com',
      websiteUrl,
      imageUrls,
      websiteName
    );

    (async function () {
      const { data, error } = await resend.emails.send({
        from: 'Aman - Nirbhaya <aman@amanchand.com.np>',
        to: [
          params.emails.includes(',')
            ? // @ts-ignore
              params.emails.split(',')[0]
            : params.emails
        ],
        subject:
          'IMMEDIATE CONTENT REMOVAL DEMAND - UNAUTHORIZED INTIMATE CONTENT',
        html: email
      });

      if (error) {
        return console.error({ error });
      }

      ToastAndroid.show('DMCA takedown request sent', ToastAndroid.SHORT);
    })();
  }

  async function requestCyberBureau() {
    const websiteUrl = params.url as string;
    const imageUrls = params.image_url as string;
    const websiteName = params.website_name as string;

    const email = EMAIL_TEMPLATE(
      'Aman Chand',
      'amanchand012@gmail.com',
      websiteUrl,
      imageUrls,
      websiteName,
      'CYBER_BUREAU_TEMPLATE'
    );

    (async function () {
      const { data, error } = await resend.emails.send({
        from: 'Aman - Nirbhaya <aman@amanchand.com.np>',
        to: [
          params.emails.includes(',')
            ? // @ts-ignore
              params.emails.split(',')[0]
            : params.emails
        ],
        subject:
          'IMMEDIATE CONTENT REMOVAL DEMAND - UNAUTHORIZED INTIMATE CONTENT',
        html: email
      });

      if (error) {
        return console.error({ error });
      }

      ToastAndroid.show('Reported to Cyber Bureau', ToastAndroid.SHORT);
    })();
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: params.title as string,
          statusBarStyle: 'light',
          headerStyle: {
            backgroundColor: '#222'
          },
          headerTintColor: theme.colors.whiteColor,
          headerTitleStyle: {
            color: theme.colors.whiteColor,
            fontFamily: 'HeadingFont',
            fontSize: theme.fontSize.xl
          }
        }}
      />
      <ScrollView style={styles.container}>
        <Image
          style={styles.image}
          source={{ uri: params.image_url as string }}
        />
        <View style={styles.metadataContainer}>
          <View
            style={{
              flexDirection: 'row',
              gap: 8
            }}
          >
            <Text style={styles.title}>About this image</Text>
          </View>

          <View style={styles.metadataItem}>
            <StarIcon
              width={20}
              height={20}
              fill={'#fff'}
              style={{
                marginTop: 2
              }}
            />
            <Text>{params.title as string}</Text>
          </View>

          <View style={styles.metadataItem}>
            <PenIcon
              width={20}
              height={20}
              fill={'#fff'}
              style={{
                marginTop: 3
              }}
            />
            <Text>
              {/* @ts-expect-error ERROR: type error */}
              {params.author.charAt(0).toUpperCase() + params.author.slice(1)}
            </Text>
          </View>

          <View style={styles.metadataItem}>
            <GlobeIcon
              width={20}
              height={20}
              fill={'#fff'}
              style={{
                marginTop: 3
              }}
            />
            <Link href={`https://${params.domain}`}>
              <Text
                style={{
                  textDecorationLine: 'underline'
                }}
              >
                Link to the website
              </Text>
            </Link>
          </View>

          <View style={styles.metadataItem}>
            <ClockIcon
              width={20}
              height={20}
              fill={'#fff'}
              style={{
                marginTop: 2
              }}
            />
            <Text>{new Date(params.created_at as string).toString()}</Text>
          </View>

          <View style={styles.metadataItem}>
            <MailIcon
              width={20}
              height={20}
              fill={'#fff'}
              style={{
                marginTop: 4
              }}
            />

            {params.emails.length > 0 && (
              <Link href={params.emails as any}>
                <Text
                  style={{
                    textDecorationLine: 'underline'
                  }}
                >
                  {params.emails.includes(',')
                    ? // @ts-ignore
                      params.emails.split(',')[0]
                    : params.emails}
                </Text>
              </Link>
            )}
          </View>

          <View style={styles.metadataItem}>
            <LinkIcon
              width={20}
              height={20}
              fill={'#fff'}
              style={{
                marginTop: 2
              }}
            />

            <Link href={params.url as any}>
              <Text
                style={{
                  textDecorationLine: 'underline'
                }}
              >
                Link to the matching image
              </Text>
            </Link>
          </View>

          <View
            style={{
              marginTop: 15
            }}
          >
            <LinearGradient
              colors={[theme.colors.red, 'red']}
              style={{
                borderRadius: theme.borderRadius.default,
                opacity: params.emails.length > 0 ? 1 : 0.3
              }}
            >
              <Pressable
                style={styles.button}
                android_ripple={{
                  color: theme.colors.androidRipple
                }}
                onPress={sendTakedownRequest}
                disabled={params.emails.length <= 0}
              >
                <Text>Send Takedown Request</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient
              colors={['#333', 'black', '#333']}
              style={{
                borderRadius: theme.borderRadius.default,
                marginTop: 15,
                marginBottom: 10
              }}
            >
              <Pressable
                style={styles.button}
                android_ripple={{
                  color: theme.colors.androidRipple
                }}
                onPress={requestCyberBureau}
              >
                <Text>Report to the IT Bureau</Text>
              </Pressable>
            </LinearGradient>

            <LinearGradient
              colors={[theme.colors.blue, 'blue']}
              style={{
                borderRadius: theme.borderRadius.default,
                marginTop: 5,
                marginBottom: 10,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Link
                href={
                  'https://support.google.com/websearch/contact/content_removal_form?sjid=535794946431741146-AP'
                }
                style={styles.button}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    marginHorizontal: 'auto'
                  }}
                >
                  Remove Images via Google
                </Text>
              </Link>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16
  },
  image: {
    width: '100%',
    height: 550,
    borderRadius: theme.borderRadius.default
  },
  metadataContainer: {
    marginVertical: 10
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontFamily: 'BoldBodyTextFont',
    marginBottom: 16
  },
  metadataItem: {
    marginBottom: 12,
    flexDirection: 'row',
    gap: 6
  },
  label: {
    fontSize: theme.fontSize.original,
    fontFamily: 'BoldBodyTextFont',
    marginBottom: 4
  },
  gradientButton: {
    borderRadius: theme.borderRadius.default
  },
  button: {
    paddingVertical: theme.padding.verticalButton,
    paddingHorizontal: theme.padding.horizontalButton,
    borderRadius: theme.borderRadius.default,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10
  }
}));
