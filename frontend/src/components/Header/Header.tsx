import type { Page } from "../Entry/page.model";
import "./Header.css";
import { Image } from "@chakra-ui/react"
import logo from "../../assets/logo.png";

type Props = {
  setPage: (page: Page) => void;
};

export default function Header({ setPage }: Props) {
  return (
    <header>
      <Image
        src={logo}
        width="205px"
        height="auto"
        objectFit="contain" />
      <nav>
        <button onClick={() => setPage("table")} className="nav-button">Таблица</button>
        <button onClick={() => setPage("knowledgeBase")} className="nav-button">База знаний</button>
      </nav>
    </header>
  );
}
