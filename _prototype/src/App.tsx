import { RouterProvider } from "react-router";
import { LucideProvider } from "lucide-react";
import { StoreProvider } from "./store/StoreProvider";
import { router } from "./routes";

export default function App() {
  return (
    <LucideProvider strokeWidth={1.75} size={20}>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </LucideProvider>
  );
}
