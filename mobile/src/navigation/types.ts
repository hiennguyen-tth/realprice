import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {StackScreenProps} from '@react-navigation/stack';
import type {CompositeScreenProps} from '@react-navigation/native';

// ─── Root Stack ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  LandDetail: {landId: string};
  ListingDetail: {listingId: string};
  PostListing: undefined;
  Comparison: undefined;
};

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  PhoneInput: undefined;
  OTP: {phone: string; requestId: string; expiresIn: number};
};

// ─── Main Bottom Tabs ─────────────────────────────────────────────────────────

export type MainTabParamList = {
  Map: undefined;
  Search: undefined;
  Post: undefined;
  Saved: undefined;
  Profile: undefined;
};

// ─── Screen Props ─────────────────────────────────────────────────────────────

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    StackScreenProps<RootStackParamList>
  >;

// ─── Global navigation type augmentation ─────────────────────────────────────

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
