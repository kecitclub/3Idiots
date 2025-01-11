import React from 'react';
import { Tabs } from 'expo-router';
import { useStyles } from 'react-native-unistyles';
import AidFill from '@/assets/icons/AidFill.svg';
import AidOutline from '@/assets/icons/AidOutline.svg';
import CompassFill from '@/assets/icons/CompassFill.svg';
import CompassOutline from '@/assets/icons/CompassOutline.svg';
import VideoFill from '@/assets/icons/VideoFill.svg';
import VideoOutline from '@/assets/icons/VideoOutline.svg';
import StarFill from '@/assets/icons/StarFill.svg';
import StarOutline from '@/assets/icons/StarOutline.svg';
import PeaceFill from '@/assets/icons/PeaceFill.svg';
import PeaceOutline from '@/assets/icons/PeaceOutline.svg';

export default function TabLayout() {
  const { theme } = useStyles();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          height: 68,
          elevation: 0,
          paddingTop: 14
        },
        tabBarActiveTintColor: theme.colors.activeTintColor,
        tabBarInactiveTintColor: theme.colors.inActiveTintColor,
        tabBarShowLabel: false,
        headerTitleStyle: {
          fontFamily: 'HeadingFont',
          color: theme.colors.whiteColor,
          fontSize: theme.fontSize.xxl
        },
        headerStyle: {
          backgroundColor: '#222',
          height: 85
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <AidFill fill={color} width={36} height={36} />
            ) : (
              <AidOutline fill={color} width={36} height={36} />
            )
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: 'Navigation',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <CompassFill fill={color} width={36} height={36} />
            ) : (
              <CompassOutline fill={color} width={36} height={36} />
            ),
          tabBarStyle: {
            display: 'none'
          },
          headerShown: false
        }}
      />

      <Tabs.Screen
        name="videos"
        options={{
          title: 'Evidences',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <VideoFill fill={color} width={36} height={36} />
            ) : (
              <VideoOutline fill={color} width={36} height={36} />
            )
        }}
      />

      <Tabs.Screen
        name="check"
        options={{
          title: 'Image Detection',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <StarFill fill={color} width={36} height={36} />
            ) : (
              <StarOutline fill={color} width={36} height={36} />
            )
        }}
      />

      <Tabs.Screen
        name="wellness"
        options={{
          title: 'Wellness',
          tabBarIcon: ({ color, focused }) =>
            focused ? (
              <PeaceFill fill={color} width={36} height={36} />
            ) : (
              <PeaceOutline fill={color} width={36} height={36} />
            )
        }}
      />
    </Tabs>
  );
}
