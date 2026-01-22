import { RootNavigator } from "./src/app/navigation/RootNavigator";
import "react-native-url-polyfill/auto";
import { Buffer } from "buffer";

(global as any).Buffer = Buffer;

export default function App() {
  return <RootNavigator />;
}
