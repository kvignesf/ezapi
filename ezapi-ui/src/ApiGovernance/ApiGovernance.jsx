import React, { useState } from "react";

import { getUserId } from "../shared/storage";
import { endpoint } from "../shared/network/client";

import Dashboard from "../Dashboard";
import ApiSprawl from "./ApiSprawl/ApiSprawl";

import { Tabs, Tab } from "@material-ui/core";
import makeStyles from "@material-ui/styles/makeStyles";

const Content = () => {
  const [orgProjects, setOrgProjects] = useState([]);
  const [orgDuplicates, setOrgDuplicates] = useState([]);
  const [userProjects, setUserProjects] = useState([]);
  const [userDuplicates, setUserDuplicates] = useState([]);
  const [isOrgPresent, setIsOrgPresent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [tab, setTab] = useState();

  const handleChange = (event, newTab) => {
    setTab(newTab);
  };

  const fetchSprawlData = async () => {
    const userID = getUserId();

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userID }),
    };

    setIsLoading(true);
    fetch(process.env.REACT_APP_API_URL + endpoint.apiSprawl, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        setOrgProjects(data.OrgProjects);
        setOrgDuplicates(data.OrgDuplicates);
        setUserProjects(data.userProjects);
        setUserDuplicates(data.userDuplicates);
        setIsOrgPresent(data.isOrgPresent);
      })
      .catch((error) => {
        console.error("There was an error!", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // const fetchLineageData = () => {};

  // const tabs = [
  //   {
  //     slug: "api",
  //     title: "API SPRAWL",
  //   },
  //   {
  //     slug: "dl",
  //     title: "DATA LINEAGE",
  //   },
  // ];

  const useStyles = makeStyles((theme) => ({
    tab: {
      minWidth: 100,
      fontWeight: "bold",
      fontSize: "12px",
    },
  }));

  return (
    <div>
      <div style={{ color: "", marginTop: "1.5rem", marginLeft: "2rem" }}>
        <Tabs
          value={tab}
          onChange={handleChange}
          variant="standard"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            className={useStyles.tab}
            key="api"
            label="API SPRAWL"
            onClick={() => fetchSprawlData()}
          />
        </Tabs>
        {tab == 0 ? (
          <ApiSprawl
            orgProjects={orgProjects}
            orgDuplicates={orgDuplicates}
            userProjects={userProjects}
            userDuplicates={userDuplicates}
            isOrgPresent={isOrgPresent}
            isLoading={isLoading}
          />
        ) : null}
      </div>
    </div>
  );
};

export default function ApiGovernance() {
  return (
    <Dashboard selectedIndex={6}>
      <Content />
    </Dashboard>
  );
}
