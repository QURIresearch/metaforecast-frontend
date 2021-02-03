import React, { useState } from "react";

export default function Form({ values, onChange }) {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let v = type === "checkbox" ? checked : value;
    const newValues = { ...values, [name]: v };
    onChange(newValues);
  };

  function check({ value, name, textName }) {
    return (
      <label className="inline-flex items-center">
        <input
          type="checkbox"
          value={value}
          onChange={handleInputChange}
          name={name}
        />
        <span className="ml-2">{textName}</span>
      </label>
    );
  }

  return (
    <form>
      <div className="block flex items-center justify-center">
        <input
          className="mt-1 block w-6/12"
          type="text"
          value={values.query}
          onChange={handleInputChange}
          name="query"
          label="Query"
          placeholder="Search for forecasts about..."
        />
      </div>
    </form>
  );
}

{
  /* <div className="block">
        {check({
          value: values.typeBlogPost,
          name: "typeBlogPost",
          textName: "Blog Post",
        })}
        {check({
          value: values.typeManuscript,
          name: "typeManuscript",
          textName: "Manuscript",
        })}
        {check({
          value: values.typeConferencePaper,
          name: "typeConferencePaper",
          textName: "Conference Paper",
        })}
        {check({
          value: values.typeJournalArticle,
          name: "typeJournalArticle",
          textName: "Journal Article",
        })}
      </div> */
}
