import { useState } from "react";
import "./Entry.css";
import type { Page } from "./page.model";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import KnowledgeBase from "../KnowledgeBase/KnowledgeBase";
import EmailsTable from "../EmailTable/EmailsTable";

export default function Entry() {
  const [page, setPage] = useState<Page>("table");

  return (
    <div className="wrapper">
      <Header page={page} setPage={setPage} />

      <main>
        {page === "knowledgeBase" && <KnowledgeBase />}
        {page === 'table' && <EmailsTable />}
      </main>

      <Footer />
    </div>
  );
}