import { StoreAssistant } from "../../../components/admin/store-assistant";

export default function AssistantPage() {
  return <StoreAssistant enabled={Boolean(process.env.OPENAI_API_KEY)} />;
}
