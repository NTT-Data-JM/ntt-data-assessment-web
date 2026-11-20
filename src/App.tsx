import { AppRouter } from "./routes/router";
import { DemoStoreProvider } from "./state/DemoStore";

export default function App() {
  return (
    <DemoStoreProvider>
      <AppRouter />
    </DemoStoreProvider>
  );
}
