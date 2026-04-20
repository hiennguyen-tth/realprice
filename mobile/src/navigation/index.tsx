import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createStackNavigator as createAuthStack} from '@react-navigation/stack';
import {useAuthStore} from '../store/authStore';
import MainTabs from './MainTabs';
import LandDetailScreen from '../screens/LandDetailScreen';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import PostListingScreen from '../screens/PostListingScreen';
import ComparisonScreen from '../screens/ComparisonScreen';
import PhoneInputScreen from '../screens/auth/PhoneInputScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import type {AuthStackParamList, RootStackParamList} from './types';

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createAuthStack<AuthStackParamList>();

function AuthNavigator(): React.JSX.Element {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {backgroundColor: '#FFFFFF'},
      }}>
      <AuthStack.Screen name="PhoneInput" component={PhoneInputScreen} />
      <AuthStack.Screen name="OTP" component={OTPScreen} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator(): React.JSX.Element {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {backgroundColor: '#FFFFFF'},
      }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="LandDetail"
            component={LandDetailScreen}
            options={{
              headerShown: true,
              title: 'Chi tiết thửa đất',
              headerStyle: {backgroundColor: '#FFFFFF'},
              headerTintColor: '#111827',
              headerTitleStyle: {fontWeight: '600', fontSize: 16},
            }}
          />
          <Stack.Screen
            name="ListingDetail"
            component={ListingDetailScreen}
            options={{
              headerShown: true,
              title: 'Chi tiết tin đăng',
              headerStyle: {backgroundColor: '#FFFFFF'},
              headerTintColor: '#111827',
              headerTitleStyle: {fontWeight: '600', fontSize: 16},
            }}
          />
          <Stack.Screen
            name="PostListing"
            component={PostListingScreen}
            options={{
              headerShown: true,
              title: 'Đăng tin bán/cho thuê',
              headerStyle: {backgroundColor: '#FFFFFF'},
              headerTintColor: '#111827',
              headerTitleStyle: {fontWeight: '600', fontSize: 16},
            }}
          />
          <Stack.Screen
            name="Comparison"
            component={ComparisonScreen}
            options={{
              headerShown: true,
              title: 'So sánh bất động sản',
              headerStyle: {backgroundColor: '#FFFFFF'},
              headerTintColor: '#111827',
              headerTitleStyle: {fontWeight: '600', fontSize: 16},
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
