import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MapScreen from '../screens/MapScreen';
import SearchScreen from '../screens/SearchScreen';
import PostListingScreen from '../screens/PostListingScreen';
import SavedScreen from '../screens/SavedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type {MainTabParamList} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({
  emoji,
  focused,
}: {
  emoji: string;
  focused: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.iconWrapper}>
      <Text style={[styles.emoji, focused && styles.emojiActive]}>{emoji}</Text>
    </View>
  );
}

export default function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
      }}>
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Bản đồ',
          tabBarIcon: ({focused}) => (
            <TabIcon emoji="🗺️" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Tìm kiếm',
          tabBarIcon: ({focused}) => (
            <TabIcon emoji="🔍" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Post"
        component={PostListingScreen}
        options={{
          title: 'Đăng tin',
          tabBarIcon: () => (
            <View style={styles.postButton}>
              <Text style={styles.postButtonText}>+</Text>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          title: 'Đã lưu',
          tabBarIcon: ({focused}) => (
            <TabIcon emoji="❤️" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({focused}) => (
            <TabIcon emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
    opacity: 0.6,
  },
  emojiActive: {
    opacity: 1,
  },
  postButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#F97316',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});
