/* Imports */

// React
import React, { useState } from "react";
import { useRouter } from "next/router"; // https://nextjs.org/docs/api-reference/next/router

// Utilities
import { DashboardCreator } from "../lib/display/dashboardCreator.js";
import displayForecasts from "../lib/display/displayForecasts.js";
import Layout from "./layout.js";

// Data
import { getDashboardForecastsByDashboardId, createDashboard } from "../lib/worker/getDashboardForecasts.js";

/* get Props */

export async function getServerSideProps(context) {
  console.log("getServerSideProps: ")
  let urlQuery = context.query; // this is an object, not a string which I have to parse!!
  // so for instance if the url is metaforecasts.org/dashboards?a=b&c=d
  // this returns ({a: "b", c: "d"}})
  console.log(urlQuery)
  let dashboardId = urlQuery.dashboardId;
  let numCols = urlQuery.numCols;
  let props;
  if (!!dashboardId) {
    console.log(dashboardId);
    let { dashboardForecasts, dashboardItem } = await getDashboardForecastsByDashboardId({
      dashboardId,
    });
    props = {
      initialDashboardForecasts: dashboardForecasts,
      initialDashboardId: urlQuery.dashboardId,
      initialDashboardItem: dashboardItem,
      initialNumCols: !numCols ? null : (numCols < 5 ? numCols : 4)

    };
  } else {
    console.log()
    props = {
      initialDashboardForecasts: [],
      initialDashboardId: urlQuery.dashboardId || null,
      initialDashboardItem: null,
      initialNumCols: !numCols ? null : (numCols < 5 ? numCols : 4)
    };
  }
  return {
    props: props,
  };
  /*
  let dashboardforecasts = await getdashboardforecasts({
    ids: ["metaculus-6526", "smarkets-20206424"],
  });
  let props = {
    dashboardforecasts: dashboardforecasts,
  };

  return {
    props: props,
  };
  */
}

/* Body */
export default function Home({ initialDashboardForecasts, initialDashboardItem, initialNumCols }) {
  const router = useRouter();
  const [dashboardForecasts, setDashboardForecasts] = useState(initialDashboardForecasts);
  const [dashboardItem, setDashboardItem] = useState(initialDashboardItem);
  const [numCols, setNumCols] = useState(initialNumCols)
  console.log("initialNumCols", initialNumCols)

  let handleSubmit = async (data) => {
    console.log(data)
    // Send to server to create
    // Get back the id
    let response = await createDashboard(data)
    let dashboardId = response.dashboardId
    if (!!dashboardId) {
      console.log("response: ", esponse)
      if(typeof window !== "undefined"){
        window.history.replaceState(null, "Metaforecast", `/dashboards?dashboardId=${dashboardId}`)
      }
      // router.push(`?dashboardId=${dash rboardId}`)
      // display it

      let { dashboardForecasts, dashboardItem } = await getDashboardForecastsByDashboardId({
        dashboardId,
      });
      console.log("response2", dashboardForecasts)
      setDashboardForecasts(dashboardForecasts)
      setDashboardItem(dashboardItem)
    }
  }

  // <div className={`grid ${!!numCols ? `grid-cols-${numCols} md:grid-cols-${numCols} lg:grid-cols-${numCols}`: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"} gap-4 mb-6`}>
  // <div className={`grid grid-cols-${numCols || 1} md:grid-cols-${numCols || 2} lg:grid-cols-${numCols || 3} gap-4 mb-6`}>


  return (
    <div className="mb-4 mt-3 flex flex-row justify-left items-center ">
      <div className="ml-2 mr-2 place-self-left">
        <div className={`grid grid-cols-${numCols || 1} sm:grid-cols-${numCols || 1} md:grid-cols-${numCols || 2} lg:grid-cols-${numCols || 3} gap-4 mb-6`}>
          {displayForecasts({
            results: dashboardForecasts,
            numDisplay: dashboardForecasts.length,
            showIdToggle: false
          })}
        </div>
      </div>
    </div>
  );
}
