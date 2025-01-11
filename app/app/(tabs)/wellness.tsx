import { Pressable, View, SectionList } from 'react-native';
import React from 'react';
import Text from '@/components/Text';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Image } from 'expo-image';
import ITEMS from '@/assets/items.json';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ItemRow = ({ items, theme, styles, onPress }: any) => {
  const firstItem = items[0];
  const secondItem = items[1];

  return (
    <View style={styles.rowContainer}>
      <AnimatedPressable
        style={[
          styles.itemContainer,
          {
            opacity: firstItem.inStock ? 1 : 0.3,
            filter: firstItem.inStock ? 'none' : 'grayscale(100%)'
          }
        ]}
        android_ripple={{
          color: theme.colors.androidRipple
        }}
        onPress={() => onPress(firstItem)}
        entering={FadeIn.duration(1500)}
        disabled={firstItem.inStock === false}
      >
        <Image
          source={{
            uri: firstItem.image_url
          }}
          style={styles.image}
        />
        <Text style={styles.itemName}>
          {firstItem.name.length > 60
            ? firstItem.name.slice(0, 60) + '...'
            : firstItem.name}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>
            NRs. <Text style={styles.fullPrice}>{firstItem.full_price}</Text>
            <Text style={styles.price}>{firstItem.price}</Text>
          </Text>
          <Text style={styles.discount}>{firstItem.discount}% off</Text>
        </View>
      </AnimatedPressable>

      {secondItem && (
        <AnimatedPressable
          style={[
            styles.itemContainer,
            {
              opacity: secondItem.inStock ? 1 : 0.3,
              filter: secondItem.inStock ? 'none' : 'grayscale(100%)'
            }
          ]}
          onPress={() => onPress(firstItem)}
          android_ripple={{
            color: theme.colors.androidRipple
          }}
          entering={FadeIn.duration(1250)}
          disabled={secondItem.inStock === false}
        >
          <Image
            source={{
              uri: secondItem.image_url
            }}
            style={styles.image}
          />
          <Text style={styles.itemName}>
            {secondItem.name.length > 60
              ? secondItem.name.slice(0, 60) + '...'
              : secondItem.name}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>
              NRs. <Text style={styles.fullPrice}>{secondItem.full_price}</Text>
              <Text style={styles.price}>{secondItem.price}</Text>
            </Text>
            <Text style={styles.discount}>{secondItem.discount}% off</Text>
          </View>
        </AnimatedPressable>
      )}
    </View>
  );
};

function Wellness() {
  const { styles, theme } = useStyles(stylesheet);
  const router = useRouter();

  const handleImagePress = (imageData: any) => {
    router.push({
      pathname: '/product-details',
      params: imageData
    });
  };

  const sections = Object.entries(ITEMS).map(([key, items]) => ({
    title: key.charAt(0).toUpperCase() + key.slice(1),
    data: Array.from({ length: Math.ceil(items.length / 2) }, (_, i) =>
      items.slice(i * 2, i * 2 + 2)
    )
  }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <ItemRow
          items={item}
          theme={theme}
          styles={styles}
          onPress={handleImagePress}
        />
      )}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
      )}
      style={styles.container}
    />
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 5
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10
  },
  itemContainer: {
    width: '50%',
    padding: 10,
    justifyContent: 'space-between'
  },
  image: {
    width: 150,
    height: 150
  },
  itemName: {
    fontSize: theme.fontSize.sm,
    fontFamily: 'HeadingFont',
    paddingTop: 5
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 5
  },
  priceText: {
    fontFamily: 'HeadingFont',
    fontSize: theme.fontSize.sm
  },
  fullPrice: {
    textDecorationLine: 'line-through',
    fontSize: theme.fontSize.xs
  },
  price: {
    fontSize: theme.fontSize.sm
  },
  discount: {
    fontFamily: 'HeadingFont',
    color: '#ec4343'
  },
  sectionHeader: {
    fontSize: theme.fontSize.xl,
    padding: 5,
    backgroundColor: theme.colors.background,
    textDecorationLine: 'underline'
  }
}));

export default Wellness;
