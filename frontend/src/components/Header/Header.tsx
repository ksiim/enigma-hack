import type { Page } from "../Entry/page.model";
import "./Header.css";
import { Image } from "@chakra-ui/react"
import logo from "../../assets/logo.png";

type Props = {
  page: Page;
  setPage: (page: Page) => void;
};

export default function Header({ page, setPage }: Props) {
  return (
    <header>
      <Image
        src={logo}
        width="205px"
        marginLeft={"60px"}
        height="auto"
        objectFit="contain" />
      <nav className="nav-toggle">
        <button
          onClick={() => setPage("table")}
          className={`nav-button ${page === "table" ? "nav-button--active" : ""}`}
        >
          Таблица
        </button>
        {/* <button
          onClick={() => setPage("knowledgeBase")}
          className={`nav-button ${page === "knowledgeBase" ? "nav-button--active" : ""}`}
        >
          База знаний
        </button> */}
      </nav>
    </header>
  );
}
