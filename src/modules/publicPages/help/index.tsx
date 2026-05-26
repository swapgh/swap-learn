import { createPublicPageMetadata, createPublicPageRoute } from "../PublicPage";
import { content } from "./content";

export const generateMetadata = createPublicPageMetadata(content, "/help");

export default createPublicPageRoute(content);
