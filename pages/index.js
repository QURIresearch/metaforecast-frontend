/* Imports */
import { getForecasts} from "../lib/get-forecasts.js";
import Layout from "./layout.js";
import ReactMarkdown from "react-markdown";
import Fuse from "fuse.js";
import React, { useState, useEffect } from "react";
import Form from "../lib/form.js";
import { useRouter } from 'next/router'; // https://nextjs.org/docs/api-reference/next/router
import DropdownForStars from "../lib/dropdown.js";
import {SliderForNumDisplay,SliderForNumForecasts} from "../lib/slider.js";
import MultiSelectPlatform from "../lib/multiSelectPlatforms.js";

/* Definitions */

// Search options for:
// https://github.com/krisk/Fuse/
const opts = {
  includeScore: true,
  keys: ["title", "platform", "stars"],
  ignoreLocation: true
};

// Helper functions 

export async function getStaticProps() { //getServerSideProps
  const { metaforecasts } = await getForecasts();
  return {
    props: {
      items: metaforecasts,
    },
  };
}

/*
export async function getServerSideProps(context) { //getServerSideProps
  const { metaforecasts } = await getForecasts();
  return {
    props: {
      items: metaforecasts,
      urlQuery: context.query
    },
  };
}
*/

// Display functions

let displayMarkdown = (description) => {
  if(description == null){
    return
  }else{
    description = description==null?"":description
      .replaceAll("] (", "](")
      .replaceAll(") )", "))")
      .replaceAll("( [", "([")
      .replaceAll(") ,", "),")
    if(description.length > 1000){
      return(
      <div className="font-mono text-xs">
        <ReactMarkdown>
            {description.slice(0,1000)+"..."}
        </ReactMarkdown>
      </div>)
    }else{
      return(
        <div className="font-mono text-xs">
          <ReactMarkdown>
              {description}
          </ReactMarkdown>
        </div>)
    }
  }
}

let displayNumForecasts = (forecasts) => {
  let forecastText = forecasts || "unknown"
  return ("Number of forecasts: " +forecastText)
}

let displayForecast = ({
  title,
  url,
  platform,
  description,
  binaryQuestion,
  percentage,
  forecasts,
  stars
}) => {
  if(binaryQuestion){
    return (
      <div key={title} className="pb-6 pt-3">
        <div className="text-blue-800">
          <a href={url} className="font-bold" target="_blank">
              {title}
          </a>
          {": "+percentage}
        </div>
        <div>
            {stars +" = "+ "(Platform: " + platform+") + ("+displayNumForecasts(forecasts)+")"}
        </div>
        {displayMarkdown(description)}
  
      </div>
    );
  }else{
    return (
      <div key={title} className="pb-6 pt-3">
        <div className="text-blue-800">
          <a href={url} className="font-bold">
              {title}
            </a>
          </div>
        <div>
        {stars +" = "+ "(Platform: " + platform+") + ("+displayNumForecasts(forecasts)+")"}
        </div>
        {displayMarkdown(description)}
  
      </div>
    );
  }
};

// Stars
let howmanystars = (string) => {
  let matches = string.match(/★/g);
  return matches?matches.length:0
}

export function getstars(numstars){
  let stars = "★★☆☆☆"
  switch(numstars) {
    case 0:
      stars ="☆☆☆☆☆"
      break;
    case 1:
      stars ="★☆☆☆☆"
      break;
    case 2:
      stars = "★★☆☆☆"
      break;
    case 3:
      stars = "★★★☆☆"
      break;
    case 4:
      stars = "★★★★☆"
      break;
    case 5:
      stars = "★★★★★"
      break;
    default:
      stars = "★★☆☆☆"
  }
  return(stars) 
}

// URL slugs
let transformObjectIntoUrlSlug = (obj) => {
  let results = []
  for(let key in obj){
    if(typeof obj[key] == "number" || typeof obj[key] == "string" ){
      results.push(`${key}=${obj[key]}`)
    }else if(key=="forecastingPlatforms"){
      let arr = obj[key].map(x => x.value)
      let arrstring = arr.join("|")
      results.push(`${key}=${arrstring}`)
    }
  }
  let string = "?"+results.join("&")
  return string
}

/* Body */
export default function Home({ items}){ //, urlQuery }) {
  console.log("===============")
  console.log("New page render")
  
  /* States */
  const router = useRouter()
  let initialQueryParameters = ({
    query: "",
    processedUrlYet: false,
    starsThreshold: 3,
    numDisplay:  20, 
    forecastsThreshold: 0,
    forecastingPlatforms: [ // Excluding Elicit and Omen
      { value: 'CSET-foretell', label: 'CSET-foretell' },
      { value: 'Good Judgment', label: 'Good Judgment' },
      { value: 'Good Judgment Open', label: 'Good Judgment Open' },
      { value: 'Hypermind', label: 'Hypermind' },
      { value: 'Metaculus', label: 'Metaculus' },
      { value: 'PolyMarket', label: 'PolyMarket' },
      { value: 'PredictIt', label: 'PredictIt' }
    ]    
  })
  const [queryParameters, setQueryParameters] = useState(initialQueryParameters);
  let initialSettings = {
      timeoutId: null, 
      awaitEndTyping: 500,
      time: Date.now(),
  }
  const [settings, setSettings] = useState(initialSettings);
  let initialResults =  [] 
  const [results, setResults] = useState(initialResults);
  
  /* Functions which I want to have access to the Home namespace */
  // I don't want to create an "items" object for each search.
  let executeSearch = (queryData) => {
    let results = []
    let query = queryData.query
    let forecastsThreshold = queryData.forecastsThreshold
    let starsThreshold = queryData.starsThreshold
    let forecastingPlatforms = queryData.forecastingPlatforms.map(x => x.value)
    
    let itemsFiltered = items.filter(item => 
      howmanystars(item.stars)>=starsThreshold && 
      item.forecasts>=forecastsThreshold &&
      forecastingPlatforms.includes(item.platform)
    )

        /*
    let itemsFilteredStars = items.filter(item => howmanystars(item.stars)>=starsThreshold)
    let itemsFilteredNumForecasters = itemsFilteredStars.filter(item => item.forecasts>=forecastsThreshold)
    let itemsFilteredPlatforms = itemsFilteredNumForecasters.filter(item => forecastingPlatforms.includes(item.platform))
    */
    let fuse = new Fuse(itemsFiltered, opts);
    if(query != undefined){
      results = fuse.search(query)
        .map(
        result => {
          if(result.item.platform == "Elicit"){
            result.score = (result.score*2 + 0.1) // Higher scores are worse
          }
          return result
        }
      )
      results.sort((a,b) => {
        return (Number(a.score)>Number(b.score))?1:-1
      })
      console.log("Executing search")
      console.log("executeSearch/query", query)
      console.log("executeSearch/starsThreshold", starsThreshold)
      console.log("executeSearch/forecastsThreshold", forecastsThreshold)
      console.log("executeSearch/forecastingPlatforms", forecastingPlatforms)

      console.log(settings)
    }
    console.log(results)
    return results
  }
  // I don't want display forecasts to change with a change in queryParameters, but I want it to have access to the queryParameters, in particular the numDisplay
  let displayForecasts = (results) => {
    return results
      .slice(0, queryParameters.numDisplay)
      .map((fuseSearchResult) =>
        displayForecast({ ...fuseSearchResult.item})
    )
  }
  
  /* State controllers */
  let onChangeSearchInputs = (newQueryParameters) => {
    setQueryParameters({...newQueryParameters, processedUrlYet:true});
    console.log("onChangeSearchInputs/newQueryParameters",newQueryParameters)
    clearTimeout(settings.timeoutId)
    setResults([]);
    let newtimeoutId = setTimeout(async () => {
      console.log("onChangeSearchInputs/timeout/newQueryParameters",newQueryParameters)
      let urlSlug = transformObjectIntoUrlSlug(newQueryParameters)
      router.push(urlSlug)
      let results = executeSearch(newQueryParameters) 
      setResults(results);
      setSettings({...settings, timeoutId: null}) 
    }, settings.awaitEndTyping);
    setSettings({...settings, timeoutId: newtimeoutId})
  }
  
  let processState = (queryParameters) => {
    // I am using the static version of netlify, because the server side one is too slow
    // This has the advantage that the data gets sent in the very first request, as the html
    // However, it has the disadvantage that it produces static webpages
    // In particular, parsing the url for parameters proves to be somewhat difficult
    // I do it by having a state variable
    
    // Process the URL at the beginning
    if(queryParameters.processedUrlYet == false){
      let urlQuery = router.query
      console.log("processState/queryParameters", queryParameters)
      console.log("processState/query", urlQuery)
      
      if(!(urlQuery && Object.keys(urlQuery).length === 0)){
        let initialQuery = queryParameters
        let newQuery = {...initialQuery, ...urlQuery, processedUrlYet: true} 
        if(!Array.isArray(newQuery.forecastingPlatforms)){
          let forecastingPlatformsAsArray  = newQuery.forecastingPlatforms.split("|")
          let forecastingPlatformsAsObject = forecastingPlatformsAsArray.map(x => ({value:x, label:x}))
          newQuery.forecastingPlatforms = forecastingPlatformsAsObject
        }
        setQueryParameters(newQuery) 
        let results = executeSearch(newQuery)
        setResults(results)
      }

    }else {
      // Do nothing
    }

  }
  
  /* Change the stars threshold */
  const starOptions = ["≥ ★☆☆☆☆", "≥ ★★☆☆☆", "≥ ★★★☆☆", "≥ ★★★★☆"]
  let onChangeStars = (selection) => {
    console.log("onChangeStars/selection", selection)
    console.log("onChangeStars/greater than or equal", howmanystars(selection))
    let newQueryParameters = {...queryParameters, starsThreshold: howmanystars(selection)}
    onChangeSearchInputs(newQueryParameters)
  }
  
  /* Change the number of elements to display  */
  let onChangeSliderForNumDisplay = (event) => {
    console.log("onChangeSliderForNumDisplay", event[0])
    let newQueryParameters = {...queryParameters, numDisplay: Math.round(event[0])}
    onChangeSearchInputs(newQueryParameters) // Slightly inefficient because it recomputes the search in time, but it makes my logic easier.
  }
  
  /* Change the number of elements to display  */
  let onChangeSliderForNumForecasts = (event) => {
    console.log("onChangeSliderForNumForecasts", event[0])
    let newQueryParameters = {...queryParameters, forecastsThreshold: Math.round(event[0])}
    onChangeSearchInputs(newQueryParameters)
  }

  /* Change on the search bar */
  let onChangeSearchBar = (value) => {
    console.log("onChangeSearchBar/New query:", value)
    let newQueryParameters = {...queryParameters, query: value}
    onChangeSearchInputs(newQueryParameters)
  }

  /*Change selected platforms */
  let onChangeSelectedPlatforms = (value) => {
    console.log("onChangeSelectedPlatforms/Change in platforms:", value)
    let newQueryParameters = {...queryParameters, forecastingPlatforms: value}
    onChangeSearchInputs(newQueryParameters)
  }

  /* Show advanced */
  let [advancedOptions, showAdvancedOptions] = useState(false)

  /* Final return */
  return (
    <Layout key="index">
      <div className="mb-5">  
        <h1 className="text-4xl text-gray-900 tracking-tight mb-2 text-center">
          Metaforecasts
        </h1>
      </div>
      <div className="invisible">{processState(queryParameters)}
      </div>
      <label className="block mb-1">
        <Form
          value={queryParameters.query}
          onChange={onChangeSearchBar}
        />
      </label>
      <div className="flex flex-col mx-auto justify-center items-center">
      <button 
      className="text-center text-gray-600 text-sm"
      onClick={() => showAdvancedOptions(!advancedOptions)}>
        Advanced options ▼
      </button>
      </div>

      <div className={`flex-1 flex-col mx-auto justify-center items-center w-full ${advancedOptions?"":"hidden"}`}>
        <div className="grid grid-cols-3 rows-2 items-center content-center">
          <div className="flex row-span-1 col-start-1 col-end-1 row-start-1 row-end-1 items-center justify-center mb-4">
          <SliderForNumForecasts
                onChange={onChangeSliderForNumForecasts}
                value={queryParameters.forecastsThreshold}
            />
          </div>
          <div className="flex col-start-2 col-end-2 row-start-1 row-end-1 items-center justify-center mb-4">
            <DropdownForStars
                options={starOptions}
                onChange={onChangeStars}
                name="dropdown"
                value={queryParameters.starsThreshold}
                howmanystars={howmanystars}
            />
          </div>
          <div className="flex col-start-3 col-end-3 row-start-1 row-end-1 items-center justify-center mb-4">
            <SliderForNumDisplay
              value={queryParameters.numDisplay}
              onChange={onChangeSliderForNumDisplay}
            />
          </div>
          <div className="flex col-span-3 items-center justify-center mb-4">
            <MultiSelectPlatform
              value={queryParameters.forecastingPlatforms}
              onChange={onChangeSelectedPlatforms}
            />
          </div>
        </div>
      </div>

      {displayForecasts(results)}
      <span
          className="mr-1 cursor-pointer"
          onClick={() => {
            setSettings({...settings, numDisplay: settings.numDisplay*2})
          }}
          >
          {(results.length != 0 && settings.numDisplay < results.length) ? "Show more": ""}
      </span>

    </Layout>
  );
}
