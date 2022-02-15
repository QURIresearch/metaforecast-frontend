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
  let props;
  if (!!dashboardId) {
    console.log(dashboardId);
    let { dashboardForecasts, dashboardItem } = await getDashboardForecastsByDashboardId({
      dashboardId,
    });
    props = {
      initialDashboardForecasts: dashboardForecasts,
      initialDashboardId: urlQuery.dashboardId,
      initialDashboardItem: dashboardItem

    };
  } else {
    console.log()
    props = {
      initialDashboardForecasts: [],
      initialDashboardId: urlQuery.dashboardId || null,
      initialDashboardItem: null
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
export default function Home({ initialDashboardForecasts, initialDashboardItem }) {
  const router = useRouter();
  const [dashboardForecasts, setDashboardForecasts] = useState(initialDashboardForecasts);
  const [dashboardItem, setDashboardItem] = useState(initialDashboardItem);

  let handleSubmit = async (data) => {
    console.log(data)
    // Send to server to create
    // Get back the id
    let response = await createDashboard(data)
    let dashboardId = response.dashboardId
    if (!!dashboardId) {
      console.log("response: ", response)
      window.history.replaceState(null, "Metaforecast", `/dashboards?dashboardId=${dashboardId}`)
      // router.push(`?dashboardId=${dashboardId}`)
      // display it

      let { dashboardForecasts, dashboardItem } = await getDashboardForecastsByDashboardId({
        dashboardId,
      });
      console.log("response2", dashboardForecasts)
      setDashboardForecasts(dashboardForecasts)
      setDashboardItem(dashboardItem)
    }
  }
  return (
    <Layout key="index" page={"dashboard"}>
      {/* Display forecasts */}
      <div className="mt-7 mb-7">
        <h1 className={(!!dashboardItem && !!dashboardItem.title) ? "text-4xl text-center text-gray-600 mt-2 mb-2" : "hidden"}>{!!dashboardItem ? dashboardItem.title : ""}</h1>
        <p className={(!!dashboardItem && !!dashboardItem.creator) ? "text-lg text-center text-gray-600 mt-2 mb-2" : "hidden"}>{!!dashboardItem ? `Created by: ${dashboardItem.creator}` : ""}</p>
        <p className={(!!dashboardItem && !!dashboardItem.description) ? "text-lg text-center text-gray-600 mt-2 mb-2" : "hidden"}>{!!dashboardItem ? `${dashboardItem.description}` : ""}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {displayForecasts({
          results: dashboardForecasts,
          numDisplay: dashboardForecasts.length,
        })}
      </div>
      {/*  */}
      <h3 className="flex items-center col-start-2 col-end-2 w-full justify-center mt-8 mb-4">
        <span
          aria-hidden="true"
          className="flex-grow bg-gray-300 rounded h-0.5"
        ></span>
        <span className={(!!dashboardForecasts && dashboardForecasts.length > 0) ? `mx-3 text-md font-medium text-center` : "hidden"}>Or create your own</span>
        <span className={(!dashboardForecasts || dashboardForecasts.length == 0) ? `mx-3 text-md font-medium text-center` : "hidden"}>Create a dashboard!</span>
        <span
          aria-hidden="true"
          className="flex-grow bg-gray-300 rounded h-0.5"
        ></span>
      </h3>

      <div className="grid grid-cols-3 justify-center">
        <div className="flex col-start-2 col-end-2 items-center justify-center">

          <DashboardCreator
            className="justify-center"
            handleSubmit={handleSubmit}
            id={""}
          />
        </div>
      </div>
    </Layout>
  );
}
