import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import Text from '@/components/Text';
import { LinearGradient } from 'expo-linear-gradient';
import PenIcon from '@/assets/icons/Pen.svg';
import StarIcon from '@/assets/icons/Star.svg';
import ClockIcon from '@/assets/icons/Clock.svg';
import DonateIcon from '@/assets/icons/Donate.svg';
import SaleIcon from '@/assets/icons/Sale.svg';
import PriceIcon from '@/assets/icons/Price.svg';
import FullPriceIcon from '@/assets/icons/FullPrice.svg';

function ProductDetails() {
  const params = useLocalSearchParams();
  const { styles, theme } = useStyles(stylesheet);

  return (
    <>
      <Stack.Screen
        options={{
          title: params.name as string,
          statusBarStyle: 'light',
          headerStyle: {
            backgroundColor: '#222'
          },
          headerTintColor: theme.colors.whiteColor,
          headerTitleStyle: {
            color: theme.colors.whiteColor,
            fontFamily: 'HeadingFont',
            fontSize: theme.fontSize.lg
          }
        }}
      />

      <ScrollView style={styles.container}>
        <Image
          source={{ uri: params.image_url as string }}
          style={{
            width: '100%',
            height: 250,
            borderRadius: theme.borderRadius.default
          }}
        />

        <View style={styles.metadataContainer}>
          <View
            style={{
              flexDirection: 'row',
              gap: 8
            }}
          >
            <Text style={styles.title}>About this {params.type}</Text>
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
            <Text>{params.name as string}</Text>
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
            <Text>Type of item: {params.type as string}</Text>
          </View>

          <View style={styles.metadataItem}>
            <SaleIcon
              width={20}
              height={20}
              fill={'#fff'}
              style={{
                marginTop: 3
              }}
            />
            <Text>
              Discount:{' '}
              <Text
                style={{
                  fontFamily: 'BoldBodyTextFont',
                  color: '#ec4343'
                }}
              >
                {params.discount}% off{' '}
              </Text>
            </Text>
          </View>

          <View style={styles.metadataItem}>
            <PriceIcon
              width={20}
              height={20}
              fill={'#fff'}
              style={{
                marginTop: 3
              }}
            />
            <Text>Price: NRs. {params.price}</Text>
          </View>

          <View style={styles.metadataItem}>
            <FullPriceIcon
              width={20}
              height={20}
              fill={'#fff'}
              style={{
                marginTop: 3
              }}
            />
            <Text>Full Price: NRs. {params.full_price}</Text>
          </View>

          <View style={styles.metadataItem}>
            <DonateIcon
              width={20}
              height={20}
              fill={'#fff'}
              style={{
                marginTop: 2
              }}
            />
            <Text>
              Donation Amount: NRs. {Number(params.full_price) * 0.15}
            </Text>
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
            <Text>{new Date().toString()}</Text>
          </View>

          <View style={styles.metadataItem}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: '#999'
              }}
            >
              *For every purchase of any item from our app, 15% of the profit
              will be donated to NGO's helping education of underprivileged
              children.
            </Text>
          </View>

          <View
            style={{
              marginTop: 5
            }}
          >
            <LinearGradient
              colors={[theme.colors.green, 'green']}
              style={{
                borderRadius: theme.borderRadius.default,
                marginTop: 5,
                marginBottom: 30
              }}
            >
              <Pressable
                style={styles.button}
                android_ripple={{
                  color: theme.colors.androidRipple
                }}
              >
                <Text
                  style={{
                    fontSize: theme.fontSize.lg
                  }}
                >
                  Get Yourself This {/* @ts-expect-error ERROR: type error */}
                  {params.type.charAt(0).toUpperCase() + params.type.slice(1)}
                </Text>
              </Pressable>
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
    padding: 20
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

export default ProductDetails;
