import "./App.css";
import Entry from "./components/Entry/Entry";
import { Provider } from "./components/ui/provider";

export default function App() {
  return (
    <Provider>
      <Entry></Entry>
    </Provider>
  )
}