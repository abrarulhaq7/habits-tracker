global.IS_REACT_ACT_ENVIRONMENT = true;
require("react-native-gesture-handler/jestSetup");

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: inset,
    },
  };
});

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    setParams: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: "1" }),
}));

// Mock @shopify/flash-list
jest.mock("@shopify/flash-list", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    FlashList: ({ data, renderItem, keyExtractor }) => (
      <View testID="mock-flash-list">
        {data
          ? data.map((item, index) => {
              const rendered = renderItem({ item, index });
              return React.isValidElement(rendered)
                ? React.cloneElement(rendered, {
                    key: keyExtractor ? keyExtractor(item, index) : index,
                  })
                : rendered;
            })
          : null}
      </View>
    ),
  };
});

// Mock @expo/vector-icons
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Feather: (props) =>
      React.createElement(
        Text,
        { testID: `icon-feather-${props.name}` },
        props.name,
      ),
    Ionicons: (props) =>
      React.createElement(
        Text,
        { testID: `icon-ionicons-${props.name}` },
        props.name,
      ),
    MaterialCommunityIcons: (props) =>
      React.createElement(
        Text,
        { testID: `icon-mci-${props.name}` },
        props.name,
      ),
  };
});

// Mock RefreshControl
jest.mock(
  "react-native/Libraries/Components/RefreshControl/RefreshControl",
  () => {
    const React = require("react");
    const Mock = (props) => {
      const { View } = require("react-native");
      return React.createElement(View, { testID: "refresh-control", ...props });
    };
    return {
      __esModule: true,
      default: Mock,
    };
  },
);
