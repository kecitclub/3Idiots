import { Pressable, ScrollView, View } from 'react-native';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import Text from '@/components/Text';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import supabase from '@/storage/supabase';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import UploadSvg from '@/assets/images/Upload.svg';
import NotFoundSvg from '@/assets/images/404.svg';
import WorldSvg from '@/assets/images/World.svg';

const AnimatedImage = Animated.createAnimatedComponent(Image);

const ANIMATIONS = [
  {
    title: 'Encrypting Your Image',
    delay: 1500,
    svg: NotFoundSvg
  },
  {
    title: 'Getting Images from Database',
    delay: 1000,
    svg: UploadSvg
  },
  {
    title: 'Comparing the images',
    delay: 2000,
    svg: NotFoundSvg
  },
  {
    title: 'Fetching extra metadata',
    delay: 2000,
    svg: UploadSvg
  }
];

function Detection() {
  const { styles, theme } = useStyles(stylesheet);
  const [loading, setLoading] = useState(false);
  const [similar_images, setSimilarImages] = useState<any>([]);
  const [uploadedImage, setUploadedImage] = useState('');
  const router = useRouter();

  async function getSimilarImages(url: string) {
    try {
      // Dummy data for DEMO
      await new Promise((resolve) => setTimeout(resolve, 7000));

      return [
        {
          author: 'Raksha Karn',
          created_at: '2025-01-09T12:18:20.144524+00:00',
          domain: 'images-only.netlify.app/',
          emails: ['amanchand012@gmail.com', 'aman.chand@gmail.com'],
          id: '807e2078-ba98-4cee-99d4-067de4af6fc3',
          image_hash:
            '0111001001100110110000101110001110101000110100001110010010100001',
          image_url: 'https://images-only.netlify.app/images/aman.jpeg',
          title: 'Watched Leaked Video on Telegram',
          url: 'https://images-only.netlify.app',
          website_name: 'Leaked Gallery'
        },
        {
          author: 'Raksha Karn',
          created_at: '2025-01-09T12:18:20.144524+00:00',
          domain: 'images-only.netlify.app/',
          emails: ['amanchand012@gmail.com', 'aman.chand@gmail.com'],
          id: '807e2078-ba98-4cee-99d4-067de4af6fc3',
          image_hash:
            '0111001001100110110000101110001110101000110100001110010010100001',
          image_url: 'https://images-only.netlify.app/images/deepika.jpg',
          title: 'New Trending Hot Pics',
          url: 'https://images-only.netlify.app',
          website_name: 'Leaked Gallery'
        }
      ];

      const response = await fetch('http://127.0.0.1:5000/api/similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_url: url })
      });

      const data = await response.json();
      // @ts-ignore
      const filtered_data = data.similar_images.map((image) => {
        return image.metadata;
      });

      console.log(filtered_data);

      if (filtered_data.length === 0) {
        return ['none'];
      }

      return filtered_data;
    } catch (error) {
      console.log('SIMILAR IMAGES ERROR:', error);
    }
  }

  async function uploadToSupabase(uri: string, type: string) {
    try {
      setSimilarImages([]);
      setLoading(true);

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });

      const fileName = `image_${new Date().getTime()}.${type}`;

      const { data, error } = await supabase.storage
        .from('temp_images')
        .upload(fileName, decode(base64), {
          contentType: `image/${type}`,
          upsert: false
        });

      if (error) {
        console.error('Error uploading:', error.message);
        return null;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from('temp_images').getPublicUrl(fileName);

      setLoading(false);

      const similar_images = await getSimilarImages(publicUrl);

      return similar_images;
    } catch (error) {
      console.error('Error in upload:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }

  const handleImagePress = (imageData: any) => {
    router.push({
      pathname: '/image-details',
      params: imageData
    });
  };

  async function pickImage() {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1
      });

      // @ts-ignore
      setUploadedImage(result.assets[0].uri);

      // @ts-ignore
      const type = result.assets[0].mimeType?.split('/')[1];

      if (!result.canceled) {
        const data = await uploadToSupabase(
          result.assets[0].uri,
          type as string
        );

        setSimilarImages(data);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  }

  function decode(base64: string) {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }
    const bytes = new Uint8Array((base64.length * 3) >> 2);
    let a, b, c, d;
    let p = 0;
    for (let i = 0; i < base64.length; i += 4) {
      a = lookup[base64.charCodeAt(i)];
      b = lookup[base64.charCodeAt(i + 1)];
      c = lookup[base64.charCodeAt(i + 2)];
      d = lookup[base64.charCodeAt(i + 3)];
      bytes[p++] = (a << 2) | (b >> 4);
      bytes[p++] = ((b & 15) << 4) | (c >> 2);
      bytes[p++] = ((c & 3) << 6) | (d & 63);
    }
    return bytes;
  }

  const renderImagePairs = () => {
    const pairs = [];
    for (let i = 0; i < similar_images.length; i += 2) {
      pairs.push(
        <Animated.View
          key={`pair-${i}`}
          style={styles.imageRow}
          entering={FadeIn.duration(400).delay(i * 50)}
        >
          <Pressable
            style={styles.imageContainer}
            onPress={() => handleImagePress(similar_images[i])}
          >
            <AnimatedImage
              style={styles.gridImage}
              source={{ uri: similar_images[i].image_url }}
              entering={FadeIn.duration(400).delay(i * 100)}
            />

            <Text
              style={{
                marginTop: 7
              }}
            >
              {similar_images[i + 1].title.length > 25
                ? similar_images[i + 1].title.slice(0, 25) + '...'
                : similar_images[i + 1].title}
            </Text>
          </Pressable>
          {i + 1 < similar_images.length && (
            <Pressable
              style={styles.imageContainer}
              onPress={() => handleImagePress(similar_images[i + 1])}
            >
              <AnimatedImage
                style={styles.gridImage}
                source={{ uri: similar_images[i + 1].image_url }}
                entering={FadeIn.duration(400).delay((i + 1) * 100)}
              />

              <Text
                style={{
                  marginTop: 7
                }}
              >
                {similar_images[i + 1].title.length > 25
                  ? similar_images[i + 1].title.slice(0, 25) + '...'
                  : similar_images[i + 1].title}
              </Text>
            </Pressable>
          )}
        </Animated.View>
      );
    }
    return pairs;
  };

  return (
    <View style={styles.container}>
      {!loading && !uploadedImage && similar_images.length === 0 && (
        <Animated.View
          entering={FadeIn.duration(1000)}
          style={{
            flex: 1,
            marginTop: 180,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <WorldSvg width={400} height={400} />
        </Animated.View>
      )}

      {loading && (
        <Animated.View
          entering={FadeIn.duration(500)}
          exiting={FadeOut.duration(500)}
          style={{
            gap: 10,
            alignItems: 'center',
            marginTop: 100
          }}
        >
          <UploadSvg width={300} height={300} />
          <Text
            style={{
              fontSize: 40,
              fontFamily: 'HeadingFont',
              color: '#ec4343'
            }}
          >
            Uploading...
          </Text>
        </Animated.View>
      )}

      {uploadedImage && !loading && similar_images.length == 0 && (
        <Animated.View
          entering={FadeIn.duration(500)}
          style={{
            gap: 10,
            alignItems: 'center',
            marginTop: 100
          }}
        >
          <AnimatedImage
            source={{ uri: uploadedImage }}
            style={{ width: '100%', height: 350 }}
            entering={FadeIn.duration(750)}
          />
          <Animated.Text
            style={{
              fontSize: 20,
              fontFamily: 'HeadingFont',
              color: 'white'
            }}
            entering={FadeIn.duration(700).delay(200)}
          >
            Searching for similar images...
          </Animated.Text>
        </Animated.View>
      )}

      {similar_images && similar_images[0] !== 'none' && (
        <ScrollView style={{ marginBottom: 80, marginTop: 5 }}>
          {renderImagePairs()}
        </ScrollView>
      )}

      {similar_images[0] === 'none' && (
        <Animated.View
          style={{ alignItems: 'center' }}
          entering={FadeIn.duration(500)}
        >
          <NotFoundSvg width={300} height={300} />
        </Animated.View>
      )}

      <LinearGradient
        colors={['#333', 'black', '#333']}
        style={styles.gradientButton}
      >
        <Pressable
          style={styles.button}
          android_ripple={{
            color: theme.colors.androidRipple
          }}
          onPress={pickImage}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Uploading' : 'Upload your photo'}
          </Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const stylesheet = createStyleSheet((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 10
  },
  uploadedImageContainer: {
    marginVertical: 10
  },
  uploadedImage: {
    width: 75,
    height: 75,
    borderRadius: theme.borderRadius.rounded,
    marginTop: 5
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#333',
    borderRadius: theme.borderRadius.default,
    padding: 12
  },
  gridImage: {
    width: '100%',
    height: 150,
    borderRadius: theme.borderRadius.default
  },
  gradientButton: {
    borderRadius: theme.borderRadius.default,
    position: 'absolute',
    bottom: 13,
    width: '90%',
    left: '8%'
  },
  button: {
    paddingVertical: theme.padding.verticalButton,
    paddingHorizontal: theme.padding.horizontalButton,
    borderRadius: theme.borderRadius.default,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10
  },
  buttonText: {
    fontSize: theme.fontSize.lg,
    fontFamily: 'BoldBodyTextFont'
  }
}));

export default Detection;
