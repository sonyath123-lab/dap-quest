import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const FORM_SG_URL = "https://form.gov.sg/6a681b8ff9fd4553566c85d2";
const STORAGE_KEY = "dapQuestProgressV8";

const datasets = [
  {
    name: "town_gas_consumption_monthly",
    type: "Azure Synapse Serverless SQL Table",
    desc: "Monthly town gas consumption by customer type and planning area.",
    owner: "Gas Systems Team",
    refresh: "Monthly",
    sensitivity: "Official",
    qualifiedName:
      "mssql://synapsewsemadapprdiz-ondemand.sql.azuresynapse.net/ssot_energy/dbo/town_gas_consumption_monthly",
    tags: [
      "town",
      "gas",
      "consumption",
      "monthly",
      "customer",
      "planning",
      "area",
    ],
    columns: [
      {
        name: "report_month",
        type: "date",
        desc: "Reporting month for the consumption record.",
      },
      {
        name: "customer_type",
        type: "varchar",
        desc: "Type of town gas customer.",
      },
      {
        name: "planning_area",
        type: "varchar",
        desc: "Planning area linked to the customer premise.",
      },
      {
        name: "town_gas_consumption_gwh",
        type: "float",
        desc: "Town gas consumption amount in GWh.",
      },
    ],
  },
  {
    name: "ami_daily_raw",
    type: "Azure Synapse Serverless SQL Table",
    desc: "Raw daily AMI meter readings used for operational checks and detailed consumption analysis.",
    owner: "Metering Team",
    refresh: "Daily",
    sensitivity: "Sensitive Normal",
    qualifiedName:
      "mssql://synapsewsemadapprdiz-ondemand.sql.azuresynapse.net/ssot_ami/dbo/ami_daily_raw",
    tags: ["ami", "meter", "raw", "daily", "consumption", "electricity"],
    columns: [
      { name: "meter_id", type: "varchar", desc: "Unique meter identifier." },
      {
        name: "reading_date",
        type: "date",
        desc: "Date of the AMI meter reading.",
      },
      {
        name: "consumption_kwh",
        type: "float",
        desc: "Electricity consumption captured by the meter.",
      },
      {
        name: "premise_type",
        type: "varchar",
        desc: "Premise category used for operational analysis.",
      },
    ],
  },
  {
    name: "emc_market_price_daily",
    type: "Azure Synapse Serverless SQL Table",
    desc: "Daily EMC market price reference data for market monitoring and price trend analysis.",
    owner: "Market Monitoring Team",
    refresh: "Daily",
    sensitivity: "Official",
    qualifiedName:
      "mssql://synapsewsemadapprdiz-ondemand.sql.azuresynapse.net/ssot_emc/dbo/emc_market_price_daily",
    tags: ["emc", "market", "price", "daily", "reference"],
    columns: [
      {
        name: "price_date",
        type: "date",
        desc: "Date of the market price record.",
      },
      { name: "period", type: "int", desc: "Half-hour period indicator." },
      { name: "usep", type: "float", desc: "Uniform Singapore Energy Price." },
      {
        name: "price_region",
        type: "varchar",
        desc: "Market region reference.",
      },
    ],
  },
  {
    name: "elect_sales_combined",
    type: "Azure Synapse Serverless SQL Table",
    desc: "Consolidated electricity sales data by sector, customer type and planning area.",
    owner: "DAD / Energy Statistics",
    refresh: "Monthly",
    sensitivity: "Official Sensitive",
    qualifiedName:
      "mssql://synapsewsemadapprdiz-ondemand.sql.azuresynapse.net/ssot_elect/dbo/elect_sales_combined",
    tags: [
      "electricity",
      "elect",
      "sales",
      "sector",
      "customer",
      "type",
      "planning",
      "area",
    ],
    columns: [
      {
        name: "report_month",
        type: "date",
        desc: "Reporting month for the electricity sales record.",
      },
      {
        name: "sector",
        type: "varchar",
        desc: "Sector grouping used for electricity sales reporting.",
      },
      {
        name: "customer_type",
        type: "varchar",
        desc: "Customer type such as Residential, Commercial or Industrial.",
      },
      {
        name: "planning_area",
        type: "varchar",
        desc: "Planning area used to compare electricity sales geographically.",
      },
      {
        name: "elect_sales_gwh",
        type: "float",
        desc: "Electricity sales amount in GWh. Use this to calculate total electricity sales.",
      },
    ],
  },
  {
    name: "solar_installation_summary",
    type: "Azure Synapse Serverless SQL Table",
    desc: "Summary of solar installation capacity by month and installation category.",
    owner: "Renewables Team",
    refresh: "Monthly",
    sensitivity: "Official",
    qualifiedName:
      "mssql://synapsewsemadapprdiz-ondemand.sql.azuresynapse.net/ssot_solar/dbo/solar_installation_summary",
    tags: ["solar", "installation", "capacity", "renewable"],
    columns: [
      {
        name: "report_month",
        type: "date",
        desc: "Reporting month for the solar installation record.",
      },
      {
        name: "installation_category",
        type: "varchar",
        desc: "Category of solar installation.",
      },
      {
        name: "installed_capacity_mwp",
        type: "float",
        desc: "Installed solar capacity in MWp.",
      },
      {
        name: "system_count",
        type: "int",
        desc: "Number of solar systems installed.",
      },
    ],
  },
  {
    name: "generation_output_monthly",
    type: "Azure Synapse Serverless SQL Table",
    desc: "Monthly electricity generation output by generation source and fuel type.",
    owner: "Energy Supply Team",
    refresh: "Monthly",
    sensitivity: "Official",
    qualifiedName:
      "mssql://synapsewsemadapprdiz-ondemand.sql.azuresynapse.net/ssot_generation/dbo/generation_output_monthly",
    tags: ["generation", "output", "monthly", "electricity"],
    columns: [
      {
        name: "report_month",
        type: "date",
        desc: "Reporting month for generation output.",
      },
      {
        name: "fuel_type",
        type: "varchar",
        desc: "Fuel type used for generation.",
      },
      {
        name: "generation_source",
        type: "varchar",
        desc: "Generation source category.",
      },
      {
        name: "generation_output_gwh",
        type: "float",
        desc: "Electricity generation output in GWh.",
      },
    ],
  },
  {
    name: "electricity_tariff_reference",
    type: "Azure Synapse Serverless SQL Table",
    desc: "Reference table for electricity tariff categories, effective periods and rate groups.",
    owner: "Tariff Team",
    refresh: "As required",
    sensitivity: "Official",
    qualifiedName:
      "mssql://synapsewsemadapprdiz-ondemand.sql.azuresynapse.net/reference/dbo/electricity_tariff_reference",
    tags: ["electricity", "tariff", "reference", "rate"],
    columns: [
      {
        name: "effective_start_date",
        type: "date",
        desc: "Start date of the tariff period.",
      },
      {
        name: "effective_end_date",
        type: "date",
        desc: "End date of the tariff period.",
      },
      {
        name: "tariff_category",
        type: "varchar",
        desc: "Electricity tariff category.",
      },
      {
        name: "tariff_rate",
        type: "float",
        desc: "Tariff rate for the category and period.",
      },
    ],
  },
];

const quizQuestions = [
  {
    text: "You need to understand what a dataset contains before using it.",
    answer: "Purview",
    options: ["Synapse", "Purview", "Power BI"],
  },
  {
    text: "You need to group electricity sales by planning area and sort the results.",
    answer: "Synapse",
    options: ["Synapse", "Power BI", "Purview"],
  },
  {
    text: "You need management to filter a dashboard and compare trends visually.",
    answer: "Power BI",
    options: ["Purview", "Power BI", "Synapse"],
  },
];

const leftPairCards = [
  {
    id: "find",
    text: "Discover & understand available data",
    answer: "Purview",
    color: "blue",
  },
  {
    id: "query",
    text: "Query, prepare and rank data",
    answer: "Synapse",
    color: "green",
  },
  {
    id: "visual",
    text: "Visualise insights and dashboards",
    answer: "Power BI",
    color: "orange",
  },
];

const rightPairCards = [
  { id: "r1", text: "Power BI" },
  { id: "r2", text: "Purview" },
  { id: "r3", text: "Synapse" },
];

function norm(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function searchDatasets(query) {
  const q = norm(query);
  if (!q) return datasets;
  const tokens = q.split(/\s+/).filter(Boolean);
  return datasets.filter((d) => {
    const haystack = [
      d.name,
      d.desc,
      ...d.tags,
      ...d.columns.map((c) => `${c.name} ${c.desc}`),
    ]
      .join(" ")
      .toLowerCase();
    return tokens.every((t) => haystack.includes(t));
  });
}

function relevanceForDataset(dataset) {
  const checks = [
    dataset.tags.includes("electricity") || dataset.tags.includes("elect"),
    dataset.tags.includes("sales"),
    dataset.tags.includes("planning") || dataset.tags.includes("area"),
    dataset.columns.some((c) => c.name === "elect_sales_gwh"),
    dataset.columns.some((c) => c.name === "planning_area"),
  ];
  return checks.filter(Boolean).length;
}

export default function App() {
  const [view, setView] = useState("home");
  const [completed, setCompleted] = useState({});
  const [search, setSearch] = useState("");
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [purviewStatus, setPurviewStatus] = useState("");
  const [querySolved, setQuerySolved] = useState(false);
  const [rankOrder, setRankOrder] = useState(["Jurong", "Punggol", "Bedok"]);
  const [rankStatus, setRankStatus] = useState("");
  const [powerExplored, setPowerExplored] = useState(false);
  const [powerAnswer, setPowerAnswer] = useState("");
  const [powerStatus, setPowerStatus] = useState("");
  const [quizChoices, setQuizChoices] = useState({});
  const [pairings, setPairings] = useState({});
  const [selectedLeftId, setSelectedLeftId] = useState(null);
  const [matchStatus, setMatchStatus] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setView(data.view || "home");
        setCompleted(data.completed || {});
        setSearch(data.search || "");
        setSelectedDataset(data.selectedDataset || null);
        setPurviewStatus(data.purviewStatus || "");
        setQuerySolved(Boolean(data.querySolved));
        setRankOrder(data.rankOrder || ["Jurong", "Punggol", "Bedok"]);
        setRankStatus(data.rankStatus || "");
        setPowerExplored(Boolean(data.powerExplored));
        setPowerAnswer(data.powerAnswer || "");
        setPowerStatus(data.powerStatus || "");
        setQuizChoices(data.quizChoices || {});
        setPairings(data.pairings || {});
        setSelectedLeftId(data.selectedLeftId || null);
        setMatchStatus(data.matchStatus || "");
      }
    } catch (error) {
      console.warn("Unable to load saved DAP Quest progress", error);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          view,
          completed,
          search,
          selectedDataset,
          purviewStatus,
          querySolved,
          rankOrder,
          rankStatus,
          powerExplored,
          powerAnswer,
          powerStatus,
          quizChoices,
          pairings,
          selectedLeftId,
          matchStatus,
        })
      );
    } catch (error) {
      console.warn("Unable to save DAP Quest progress", error);
    }
  }, [
    hasLoaded,
    view,
    completed,
    search,
    selectedDataset,
    purviewStatus,
    querySolved,
    rankOrder,
    rankStatus,
    powerExplored,
    powerAnswer,
    powerStatus,
    quizChoices,
    pairings,
    selectedLeftId,
    matchStatus,
  ]);

  const completeCount = ["purview", "synapse", "powerbi"].filter(
    (x) => completed[x]
  ).length;
  const quizScore = quizQuestions.filter(
    (q, idx) => quizChoices[idx] === q.answer
  ).length;
  const matchingDone = leftPairCards.every(
    (card) => pairings[card.id] === card.answer
  );
  const allPairsSubmittedCorrect = matchStatus === "correct" && matchingDone;
  const quizDone =
    quizScore === quizQuestions.length && allPairsSubmittedCorrect;
  const progress = Math.round(((completeCount + (quizDone ? 1 : 0)) / 4) * 100);

  function reset() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setView("home");
    setCompleted({});
    setSearch("");
    setSelectedDataset(null);
    setPurviewStatus("");
    setQuerySolved(false);
    setRankOrder(["Jurong", "Punggol", "Bedok"]);
    setRankStatus("");
    setPowerExplored(false);
    setPowerAnswer("");
    setPowerStatus("");
    setQuizChoices({});
    setPairings({});
    setSelectedLeftId(null);
    setMatchStatus("");
  }

  function next() {
    if (!completed.purview) return setView("purview");
    if (!completed.synapse) return setView("synapse");
    if (!completed.powerbi) return setView("powerbi");
    if (quizDone) return setView("complete");
    return setView("quiz");
  }

  function complete(id) {
    setCompleted((prev) => ({ ...prev, [id]: true }));
    setView("home");
  }

  return (
    <div className="page">
      <div className="phone">
        <header className="header">
          <div>
            <div className="eyebrow">EMA Data Analytics Platform </div>
            <div className="title">DAP Quest</div>
          </div>
          <button className="iconBtn" onClick={reset}>
            ↻
          </button>
        </header>
        <div className="progressWrap">
          <div className="progressText">
            <span>{completeCount + (quizDone ? 1 : 0)}/4 completed</span>
            <span>{progress}%</span>
          </div>
          <div className="bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
        <main className="main">
          {view === "home" && (
            <Home
              completed={completed}
              quizDone={quizDone}
              next={next}
              open={setView}
            />
          )}
          {view === "purview" && (
            <PurviewMission
              search={search}
              setSearch={setSearch}
              selectedDataset={selectedDataset}
              setSelectedDataset={setSelectedDataset}
              status={purviewStatus}
              setStatus={setPurviewStatus}
              back={() => setView("home")}
              complete={() => complete("purview")}
            />
          )}
          {view === "synapse" && (
            <SynapseMission
              solved={querySolved}
              setSolved={setQuerySolved}
              rankOrder={rankOrder}
              setRankOrder={setRankOrder}
              status={rankStatus}
              setStatus={setRankStatus}
              back={() => setView("home")}
              complete={() => complete("synapse")}
            />
          )}
          {view === "powerbi" && (
            <PowerMission
              explored={powerExplored}
              setExplored={setPowerExplored}
              answer={powerAnswer}
              setAnswer={setPowerAnswer}
              status={powerStatus}
              setStatus={setPowerStatus}
              back={() => setView("home")}
              complete={() => complete("powerbi")}
            />
          )}
          {view === "quiz" && (
            <Quiz
              quizChoices={quizChoices}
              setQuizChoices={setQuizChoices}
              pairings={pairings}
              setPairings={setPairings}
              selectedLeftId={selectedLeftId}
              setSelectedLeftId={setSelectedLeftId}
              matchStatus={matchStatus}
              setMatchStatus={setMatchStatus}
              quizScore={quizScore}
              quizDone={quizDone}
              back={() => setView("home")}
              complete={() => setView("complete")}
            />
          )}
          {view === "complete" && <Complete back={() => setView("home")} />}
        </main>
      </div>
    </div>
  );
}

function Home({ completed, quizDone, next, open }) {
  let ctaText = "Start";
  if (quizDone) ctaText = "View Completion Badge";
  else if (completed.powerbi) ctaText = "Continue: Final Quiz";
  else if (completed.synapse) ctaText = "Continue: Mission 3";
  else if (completed.purview) ctaText = "Continue: Mission 2";

  const cards = [
    {
      id: "purview",
      title: "Mission 1: Find the Data",
      sub: "Search and select a suitable dataset",
      done: completed.purview,
      locked: false,
      lockText: "",
    },
    {
      id: "synapse",
      title: "Mission 2: Work with the Data",
      sub: "Build a query and rank results",
      done: completed.synapse,
      locked: !completed.purview,
      lockText: "Complete Mission 1 first",
    },
    {
      id: "powerbi",
      title: "Mission 3: Explore Insights",
      sub: "Use an interactive dashboard",
      done: completed.powerbi,
      locked: !completed.synapse,
      lockText: "Complete Mission 2 first",
    },
  ];
  const quizLocked = !(
    completed.purview &&
    completed.synapse &&
    completed.powerbi
  );

  return (
    <>
      <section className="hero">
        <div className="pill">🏅 DAP QUEST</div>
        <h1>Can you turn a question into an insight?</h1>
        <p>Find the data, work with the data, then communicate the insight.</p>
        <div className="journey">
          <span>Find</span>
          <b>→</b>
          <span>Query</span>
          <b>→</b>
          <span>Visualise</span>
        </div>
        <button className="primaryWhite" onClick={next}>
          {ctaText}
        </button>
      </section>
      <section className="stack">
        {cards.map((card, i) => (
          <button
            className={`missionCard ${card.locked ? "locked" : ""}`}
            key={card.id}
            onClick={() => !card.locked && open(card.id)}
            disabled={card.locked}
          >
            <div className="num">{i + 1}</div>
            <div>
              <strong>{card.title}</strong>
              <p>{card.sub}</p>
              {card.locked && <p className="lockedNote">🔒 {card.lockText}</p>}
            </div>
            <span>{card.done ? "✅" : card.locked ? "🔒" : "›"}</span>
          </button>
        ))}
        <button
          className={`missionCard ${quizLocked ? "disabled" : "ready"}`}
          disabled={quizLocked}
          onClick={() => open("quiz")}
        >
          <div className="num amber">Q</div>
          <div>
            <strong>Final Challenge</strong>
            <p>Match DAP capabilities to their tools</p>
            {quizLocked && (
              <p className="lockedNote">🔒 Complete Missions 1-3 first</p>
            )}
          </div>
          <span>{quizDone ? "✅" : quizLocked ? "🔒" : "›"}</span>
        </button>
      </section>
    </>
  );
}

function Back({ onClick }) {
  return (
    <button className="back" onClick={onClick}>
      ← Back to quest
    </button>
  );
}

function PurviewMission({
  search,
  setSearch,
  selectedDataset,
  setSelectedDataset,
  status,
  setStatus,
  back,
  complete,
}) {
  const results = useMemo(() => searchDatasets(search), [search]);

  function selectDataset(dataset) {
    setSelectedDataset(dataset);
    setStatus("");
  }

  function check() {
    setStatus(
      selectedDataset?.name === "elect_sales_combined" ? "correct" : "wrong"
    );
  }

  return (
    <>
      <Back onClick={back} />

      <section className="banner">
        <span>STEP 1</span>
        <h1>Find a suitable dataset</h1>
        <p>
          A director asks: “Can we analyse <strong>electricity sales</strong> by{" "}
          <strong>customer type</strong> and <strong>planning area</strong>?”
          Search the catalogue and select the best dataset.
        </p>
      </section>

      <section className="card">
        <div className="label">Search DAP Data Catalogue</div>

        <div
          className={`selectStatusBanner ${
            status === "correct"
              ? "hasSelection"
              : status === "wrong"
              ? "wrongSelection"
              : selectedDataset
              ? "selectedPending"
              : "noSelection"
          }`}
        >
          <div>
            <span className="selectionLabel">🔑 Key Action</span>

            <strong>
              Selected Dataset:{" "}
              {selectedDataset ? selectedDataset.name : "None Selected"}
            </strong>

            <p>
              {status === "correct"
                ? "Correct dataset selected. Read the Purview explanation below, then complete the mission."
                : status === "wrong"
                ? "Not quite. Review the dataset descriptions and choose the one that best matches the business question."
                : selectedDataset
                ? "Dataset selected. Click Confirm Selection to verify your answer."
                : "Click Select Dataset on one of the search results below."}
            </p>

            <div className="topActions">
              <button
                className={`secondary topConfirmBtn ${
                  status === "correct"
                    ? "confirmedBtn"
                    : status === "wrong"
                    ? "tryAgainBtn"
                    : ""
                }`}
                onClick={check}
                disabled={!selectedDataset}
              >
                {status === "wrong"
                  ? "❌ Incorrect Dataset Selected"
                  : status === "correct"
                  ? "✅ Selection Confirmed"
                  : "Confirm Selection"}
              </button>

              <button
                className="primary topCompleteBtn"
                disabled={status !== "correct"}
                onClick={complete}
              >
                🔑 Complete Mission
              </button>
            </div>
          </div>
        </div>

        {status === "correct" && (
          <Reveal
            title="DAP Capability: Discover Data"
            text="Purview is the data catalogue within DAP. It helps users search for available datasets, understand what each dataset contains, and identify the most relevant data before moving on to analysis in Synapse or visualisation in Power BI."
          />
        )}

        {status === "wrong" && (
          <div className="error">
            For this question, look for a dataset that supports the analysis of
            electricity sales. Please try again by selecting another dataset.
          </div>
        )}

        <div className="searchRow">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedDataset(null);
              setStatus("");
            }}
            placeholder="Search e.g. electricity sales, town gas, AMI, EMC"
          />
          {search && <button onClick={() => setSearch("")}>Clear</button>}
        </div>

        <div className="chips">
          <button onClick={() => setSearch("electricity sales")}>
            electricity sales
          </button>
          <button onClick={() => setSearch("town gas")}>town gas</button>
          <button onClick={() => setSearch("ami")}>AMI</button>
          <button onClick={() => setSearch("emc")}>EMC</button>
        </div>

        <p className="muted">
          {results.length} result{results.length === 1 ? "" : "s"} found
        </p>

        <div className="datasetGrid">
          {results.map((d) => {
            const isSelected = selectedDataset?.name === d.name;
            return (
              <button
                key={d.name}
                className={`dataset selectableDataset ${
                  isSelected ? "selected" : ""
                }`}
                onClick={() => selectDataset(d)}
              >
                <div className="datasetTitleRow">
                  <strong>{d.name}</strong>
                </div>

                <p>{d.desc}</p>

                <div
                  className={`datasetAction ${
                    isSelected ? "selectedAction" : ""
                  }`}
                >
                  {isSelected ? "✅ Selected" : "Select Dataset"}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

function SynapseMission({
  solved,
  setSolved,
  rankOrder,
  setRankOrder,
  status,
  setStatus,
  back,
  complete,
}) {
  function move(i, direction) {
    const target = i + direction;
    if (target < 0 || target >= rankOrder.length) return;
    const next = [...rankOrder];
    [next[i], next[target]] = [next[target], next[i]];
    setRankOrder(next);
    setStatus("");
  }
  function checkRank() {
    const correct = ["Punggol", "Bedok", "Jurong"];
    setStatus(
      rankOrder.every((x, i) => x === correct[i]) ? "correct" : "wrong"
    );
  }
  return (
    <>
      <Back onClick={back} />
      <section className="banner">
        <span>STEP 2</span>
        <h1>Rank the planning areas</h1>
        <p>
          You found the electricity sales dataset. Configure the query to
          compare <strong>planning areas</strong> by{" "}
          <strong>total electricity sales</strong>.
        </p>
      </section>
      <section className="card">
        <QueryBuilder setSolved={setSolved} />
      </section>
      <section className="card">
        <div className="label">Mini challenge</div>
        <h2>
          Reorder the <strong>planning areas</strong> from{" "}
          <strong>highest</strong> to <strong>lowest</strong>.
        </h2>
        <div className="ranking">
          {rankOrder.map((area, i) => (
            <div className="rankRow" key={area}>
              <span>{i + 1}</span>
              <strong>{area}</strong>
              <div>
                <button disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button
                  disabled={i === rankOrder.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="secondary" onClick={checkRank}>
          Check ranking
        </button>
        {status === "correct" && (
          <Reveal
            title="DAP Capability: Work with Data"
            text="Synapse is the analytics workspace within DAP. It helps users query datasets, group and sort records, aggregate results, and prepare data for reporting or analysis."
          />
        )}
        {status === "wrong" && (
          <div className="error">
            ❌ Not quite. Use the query table to arrange the areas from highest
            to lowest.
          </div>
        )}
        {!solved && (
          <p className="muted">Run the query before completing this mission.</p>
        )}
        <button
          className="primary"
          disabled={status !== "correct" || !solved}
          onClick={complete}
        >
          🔑 Complete Mission
        </button>
      </section>
    </>
  );
}

function QueryBuilder({ setSolved }) {
  const [group, setGroup] = useState("");
  const [measure, setMeasure] = useState("");
  const [order, setOrder] = useState("");
  const [ran, setRan] = useState(false);
  const [status, setStatus] = useState("");
  const canRun = group && measure && order;
  function clear() {
    setRan(false);
    setStatus("");
    setSolved(false);
  }
  function run() {
    const ok =
      group === "planning_area" &&
      measure === "SUM(elect_sales_gwh)" &&
      order === "DESC";
    setRan(ok);
    setStatus(ok ? "correct" : "wrong");
    setSolved(ok);
  }
  return (
    <div className="codePanel">
      <div className="codeTop">Query builder</div>
      <div className="intro">
        Dataset selected: <strong>elect_sales_combined</strong>
      </div>
      <div className="builder">
        <label>
          Compare by
          <select
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              clear();
            }}
          >
            <option value="">Choose field</option>
            <option value="sector">sector</option>
            <option value="customer_type">customer_type</option>
            <option value="planning_area">planning_area</option>
          </select>
        </label>
        <label>
          Measure
          <select
            value={measure}
            onChange={(e) => {
              setMeasure(e.target.value);
              clear();
            }}
          >
            <option value="">Choose measure</option>
            <option value="COUNT(*)">number of records</option>
            <option value="AVG(elect_sales_gwh)">
              average electricity sales
            </option>
            <option value="SUM(elect_sales_gwh)">
              total electricity sales
            </option>
          </select>
        </label>
        <label>
          Order
          <select
            value={order}
            onChange={(e) => {
              setOrder(e.target.value);
              clear();
            }}
          >
            <option value="">Choose order</option>
            <option value="ASC">lowest first</option>
            <option value="DESC">highest first</option>
          </select>
        </label>
      </div>
      <button className="run" onClick={run} disabled={!canRun}>
        ▶ Run Query
      </button>
      <pre>{`SELECT ${group || "_____"}, ${
        measure || "_____"
      } AS total_sales\nFROM elect_sales_combined\nGROUP BY ${
        group || "_____"
      }\nORDER BY total_sales ${order || "_____"}\nLIMIT 3;`}</pre>
      {status === "wrong" && (
        <div className="darkError">
          The query does not show the ranking needed. Think: planning area,
          total sales, highest first.
        </div>
      )}
      {ran && (
        <div>
          <table className="resultTable">
            <thead>
              <tr>
                <th>planning_area</th>
                <th>total_sales_gwh</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Punggol</td>
                <td>1,284</td>
              </tr>
              <tr>
                <td>Bedok</td>
                <td>1,176</td>
              </tr>
              <tr>
                <td>Jurong</td>
                <td>1,093</td>
              </tr>
            </tbody>
          </table>
          <div className="successDark">
            Use this result to reorder the planning areas below.
          </div>
        </div>
      )}
    </div>
  );
}

function PowerMission({
  explored,
  setExplored,
  answer,
  setAnswer,
  status,
  setStatus,
  back,
  complete,
}) {
  function check() {
    const cleaned = norm(answer).replace(/\s/g, "").replace("gwh", "");
    setStatus(cleaned === "92" ? "correct" : "wrong");
  }
  return (
    <>
      <Back onClick={back} />
      <section className="banner">
        <span>STEP 3</span>
        <h1>Explore the dashboard</h1>
        <p>
          Senior management wants to know the{" "}
          <strong>peak monthly electricity usage</strong> for the{" "}
          <strong>Industrial</strong> segment.
        </p>
      </section>
      <section className="card">
        <InteractiveChart setExplored={setExplored} />
      </section>
      <section className="card">
        <div className="label">Mini challenge</div>
        <h2>
          For <strong>Industrial</strong>, what is the{" "}
          <strong>highest monthly usage value</strong>?
        </h2>
        <input
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setStatus("");
          }}
          placeholder="Enter number only"
        />
        <button className="secondary" onClick={check} disabled={!answer.trim()}>
          Check Answer
        </button>
        {status === "correct" && (
          <Reveal
            title="DAP Capability: Visualise Insights"
            text="Power BI is the dashboarding and reporting tool within DAP. It helps users explore dashboards interactively, filter information, inspect values, compare trends, and share insights."
          />
        )}
        {status === "wrong" && (
          <div className="error">
            ❌ Not quite. Select Industrial and tap the highest point or bar.
          </div>
        )}
        {!explored && (
          <p className="muted">Interact with the dashboard first.</p>
        )}
        <button
          className="primary"
          disabled={status !== "correct" || !explored}
          onClick={complete}
        >
          🔑 Complete Mission
        </button>
      </section>
    </>
  );
}

function InteractiveChart({ setExplored }) {
  const data = {
    Residential: [42, 50, 46, 57, 64, 69, 73, 88, 71, 63, 59, 54],
    Commercial: [38, 41, 43, 48, 52, 61, 66, 79, 68, 60, 55, 49],
    Industrial: [55, 58, 53, 62, 70, 75, 81, 92, 83, 77, 69, 61],
  };
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const [segment, setSegment] = useState("Residential");
  const [type, setType] = useState("line");
  const [sel, setSel] = useState(null);
  const vals = data[segment];
  const max = Math.max(...vals);
  const peak = vals.indexOf(max);
  const points = vals
    .map((v, i) => `${18 + i * 24},${118 - (v / max) * 86}`)
    .join(" ");
  function click(fn) {
    setExplored(true);
    fn();
  }
  return (
    <div>
      <div className="label">Interactive Dashboard / Power BI</div>
      <div className="task">
        <strong>Your task:</strong> Select <strong>Industrial</strong>, then tap
        the highest point or bar to reveal the value.
      </div>
      <div className="dashBtns">
        {Object.keys(data).map((s) => (
          <button
            key={s}
            className={segment === s ? "active" : ""}
            onClick={() =>
              click(() => {
                setSegment(s);
                setSel(null);
              })
            }
          >
            {s}
          </button>
        ))}
      </div>
      <div className="dashBtns">
        <button
          className={type === "line" ? "active" : ""}
          onClick={() => click(() => setType("line"))}
        >
          Line
        </button>
        <button
          className={type === "bar" ? "active" : ""}
          onClick={() => click(() => setType("bar"))}
        >
          Bar
        </button>
      </div>
      <div className="kpis">
        <div>
          <span>Selected Month</span>
          <strong>{sel === null ? "Tap chart" : months[sel]}</strong>
        </div>
        <div>
          <span>Selected Value</span>
          <strong>{sel === null ? "Tap chart" : `${vals[sel]} GWh`}</strong>
        </div>
      </div>
      <svg className="chart" viewBox="0 0 300 150">
        <line x1="18" y1="118" x2="288" y2="118" stroke="#cbd5e1" />
        <line x1="18" y1="28" x2="18" y2="118" stroke="#cbd5e1" />
        {type === "line" && (
          <polyline
            points={points}
            fill="none"
            stroke="#2563eb"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {vals.map((v, i) => {
          const x = 18 + i * 24;
          const y = 118 - (v / max) * 86;
          const isSel = sel === i;
          const isPeak = peak === i;
          return type === "bar" ? (
            <g
              key={months[i]}
              onClick={() => click(() => setSel(i))}
              className="clickable"
            >
              <rect
                x={x - 7}
                y={y}
                width="14"
                height={118 - y}
                rx="4"
                fill={isSel ? "#f59e0b" : isPeak ? "#059669" : "#60a5fa"}
              />
              <text x={x - 8} y="136" fontSize="8" fill="#64748b">
                {months[i]}
              </text>
            </g>
          ) : (
            <g
              key={months[i]}
              onClick={() => click(() => setSel(i))}
              className="clickable"
            >
              <circle
                cx={x}
                cy={y}
                r={isSel ? 7 : isPeak ? 6 : 4}
                fill={isSel ? "#f59e0b" : isPeak ? "#059669" : "#60a5fa"}
              />
              <text x={x - 8} y="136" fontSize="8" fill="#64748b">
                {months[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="muted">
        Tip: Use the segment buttons as slicers, then tap a point or bar to
        inspect the value.
      </p>
    </div>
  );
}

function Quiz({
  quizChoices,
  setQuizChoices,
  pairings,
  setPairings,
  selectedLeftId,
  setSelectedLeftId,
  matchStatus,
  setMatchStatus,
  quizScore,
  quizDone,
  back,
  complete,
}) {
  const [selectedTool, setSelectedTool] = useState(null);
  const allPaired = leftPairCards.every((card) => pairings[card.id]);
  const usedTools = new Set(Object.values(pairings));

  function linkPair(leftId, toolName) {
    setPairings((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((existingLeftId) => {
        if (next[existingLeftId] === toolName) delete next[existingLeftId];
      });
      next[leftId] = toolName;
      return next;
    });
    setSelectedLeftId(null);
    setSelectedTool(null);
    setMatchStatus("");
  }
  function chooseCapability(card) {
    setMatchStatus("");
    if (selectedTool) linkPair(card.id, selectedTool);
    else setSelectedLeftId(card.id);
  }
  function chooseTool(tool) {
    setMatchStatus("");
    if (selectedLeftId) linkPair(selectedLeftId, tool.text);
    else setSelectedTool(tool.text);
  }
  function submitMatching() {
    const correct = leftPairCards.every(
      (card) => pairings[card.id] === card.answer
    );
    setMatchStatus(correct ? "correct" : "wrong");
  }
  function capabilityStatus(card) {
    if (!matchStatus || !pairings[card.id]) return "";
    return pairings[card.id] === card.answer ? "correctPair" : "wrongPair";
  }
  function toolStatus(toolName) {
    if (!matchStatus) return "";
    const leftId = Object.keys(pairings).find(
      (id) => pairings[id] === toolName
    );
    if (!leftId) return "";
    const card = leftPairCards.find((item) => item.id === leftId);
    return card && card.answer === toolName ? "correctPair" : "wrongPair";
  }
  function toolIndex(toolName) {
    return rightPairCards.findIndex((tool) => tool.text === toolName);
  }
  function rowY(index) {
    return 56 + index * 104;
  }
  function lineClass(leftId, toolName) {
    if (!matchStatus) return "";
    const card = leftPairCards.find((item) => item.id === leftId);
    return card && card.answer === toolName ? "lineCorrect" : "lineWrong";
  }

  return (
    <>
      <Back onClick={back} />
      <section className="quizHero">
        <div>🧠</div>
        <h1>Final Challenge</h1>
        <p>Match the scenarios and connect the DAP capability cards.</p>
      </section>
      <section className="card">
        <h2>Part A: Match the scenario to the right DAP tool</h2>
        {quizQuestions.map((q, i) => {
          const selected = quizChoices[i];
          const ok = selected === q.answer;
          return (
            <div className="quizQ" key={q.text}>
              <p>
                <strong>{i + 1}.</strong> {q.text}
              </p>
              <div className="three">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    className={`${selected === opt && ok ? "correct" : ""} ${
                      selected === opt && !ok ? "wrong" : ""
                    }`}
                    onClick={() =>
                      setQuizChoices((prev) => ({ ...prev, [i]: opt }))
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {selected && (
                <div className={ok ? "okText" : "badText"}>
                  {ok ? "Correct" : "Try again"}
                </div>
              )}
            </div>
          );
        })}
        <p className="muted">
          Score: {quizScore}/{quizQuestions.length}
        </p>
      </section>
      <section className="card">
        <h2>Part B: Connect the DAP capabilities</h2>
        <p className="muted">
          DAP provides you with different capabilites across your journey with
          data. Match each DAP capability on the left with the tool that
          supports it on the right. Submit to check your answer!
        </p>
        <div className="connectBoardClean">
          <svg
            className="connectorSvg"
            viewBox="0 0 100 340"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {Object.entries(pairings).map(([leftId, toolName]) => {
              const leftIdx = leftPairCards.findIndex(
                (card) => card.id === leftId
              );
              const rightIdx = toolIndex(toolName);
              if (leftIdx < 0 || rightIdx < 0) return null;
              return (
                <line
                  key={`${leftId}-${toolName}`}
                  x1="37"
                  y1={rowY(leftIdx)}
                  x2="63"
                  y2={rowY(rightIdx)}
                  className={`connectorLine ${lineClass(leftId, toolName)}`}
                />
              );
            })}
          </svg>
          <div className="connectCol leftConnectCol">
            <div className="connectHeader">Capability</div>
            {leftPairCards.map((card) => (
              <button
                key={card.id}
                className={`connectBox ${
                  selectedLeftId === card.id ? "activeConnect" : ""
                } ${
                  pairings[card.id] ? "pairedConnect" : ""
                } ${capabilityStatus(card)}`}
                onClick={() => chooseCapability(card)}
              >
                <strong>{card.text}</strong>
              </button>
            ))}
          </div>
          <div className="connectCol rightConnectCol">
            <div className="connectHeader">Tool</div>
            {rightPairCards.map((tool) => (
              <button
                key={tool.id}
                className={`connectBox toolConnect ${
                  selectedTool === tool.text ? "activeConnect" : ""
                } ${
                  usedTools.has(tool.text) ? "pairedConnect" : ""
                } ${toolStatus(tool.text)}`}
                onClick={() => chooseTool(tool)}
              >
                <strong>{tool.text}</strong>
                {usedTools.has(tool.text) && <small>paired</small>}
              </button>
            ))}
          </div>
        </div>
        {(selectedLeftId || selectedTool) && (
          <div className="selectionHint">
            Selected:{" "}
            {selectedLeftId
              ? leftPairCards.find((item) => item.id === selectedLeftId)?.text
              : selectedTool}
            . Now select a box from the other side.
          </div>
        )}
        <button
          className="secondary"
          onClick={submitMatching}
          disabled={!allPaired}
        >
          Submit Matching
        </button>
        {matchStatus === "wrong" && (
          <div className="error">
            Some pairs are not correct yet. Green pairs are correct; red pairs
            need to be changed.
          </div>
        )}
        {matchStatus === "correct" && (
          <Reveal
            title="DAP end-to-end workflow"
            text="DAP supports the full analytics journey: Purview helps users discover and understand data, Synapse helps users query and prepare data, and Power BI helps users visualise and communicate insights."
          />
        )}
      </section>
      {quizDone && (
        <section className="card reward">
          <div className="big">✅</div>
          <h2>Quiz completed!</h2>
          <button className="primary" onClick={complete}>
            Show Completion Badge
          </button>
        </section>
      )}
    </>
  );
}

function Complete({ back }) {
  return (
    <>
      <Back onClick={back} />
      <section className="card reward">
        <div className="big">🏅</div>
        <h1>DAP Explorer</h1>
        <p>
          You completed the DAP Quest and experienced how DAP supports the
          journey from business question to data-driven insight.
        </p>
        <div className="checks">
          <div>✅ Used DAP data discovery capability: Purview</div>
          <div>✅ Used DAP analytics capability: Synapse</div>
          <div>✅ Used DAP visualisation capability: Power BI</div>
          <div>✅ Completed the end-to-end DAP workflow</div>
        </div>
        <div className="code">Completion Code: DAP-EXPLORER-2026</div>
        <a
          className="primary link"
          href={FORM_SG_URL}
          target="_blank"
          rel="noreferrer"
        >
          Submit Email for EMA Power Rewards
        </a>
        <p className="muted">
          Submit your email address through FormSG to register your completion.
        </p>
      </section>
    </>
  );
}

function Reveal({ title, text }) {
  return (
    <div className="success">
      <strong>✅ {title}</strong>
      <p>{text}</p>
    </div>
  );
}