import React from 'react';
import { View } from 'react-native';
import { Text } from '../components/AppText';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Library, Star, Settings } from 'lucide-react-native';

import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ReaderScreen from '../screens/ReaderScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // react-navigation's default tab label renders its own internal <Text>,
  // which never went through AppText — so it never picked up the app font
  // either. Supplying `tabBarLabel` as a render function instead of a
  // string hands rendering back to us, so it uses the same Text (and
  // therefore the same app-font logic) as everything else in the app.
  function renderLabel(label) {
    return ({ color }) => (
      <Text style={{ fontSize: 11, fontWeight: '600', color }}>{label}</Text>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarPressColor: 'transparent',
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 52 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarLabel: renderLabel('Library'),
          tabBarIcon: ({ color, size }) => (
            <Library color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Favorites"
        component={LibraryScreen}
        initialParams={{ onlyFavorites: true }}
        options={{
          tabBarLabel: renderLabel('Favorites'),
          tabBarIcon: ({ color, size }) => <Star color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: renderLabel('Settings'),
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        backgroundColor: colors.bg,
      }}
    >
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen
            name="Reader"
            component={ReaderScreen}
            options={{ animation: 'slide_from_bottom' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}
