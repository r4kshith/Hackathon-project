import { StoreAssistant } from "../../../components/admin/store-assistant";

export default function AssistantPage() {
  return <StoreAssistant enabled={Boolean(process.env.GEMINI_API_KEY)} />;
}
