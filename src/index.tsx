import { createRoot } from "react-dom/client";
import App from "./App";
import { CogsConnectionProvider } from "@clockworkdog/cogs-client-react";
import {MultiTimerPluginProvider} from "./MultiTimerPluginProvider";

function Root() {
  return (
    <MultiTimerPluginProvider>
      <App />
    </MultiTimerPluginProvider>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<Root />);
