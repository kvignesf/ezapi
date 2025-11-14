import React, { useState } from "react";
import ReactPaginate from "react-paginate";

import { Switch, Stack, Typography } from "@mui/material";
import {
  alpha,
  styled,
  Tooltip,
  tooltipClasses,
  IconButton,
} from "@mui/material";
import Colors from "../../shared/colors";
import moment from "moment";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import InfoIcon from "@mui/icons-material/Info";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LoaderWithMessage from "../../shared/components/LoaderWithMessage";

import TreeGraph from "./TreeGraph";

export default function ApiSprawl({
  orgProjects,
  orgDuplicates,
  userProjects,
  userDuplicates,
  isOrgPresent,
  isLoading,
}) {
  const [checked, setChecked] = useState(false);
  const [view, setView] = useState(true);

  const [selectedDuplicate, setSelectedDuplicate] = useState();
  const [selectedProject, setSelectedProject] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  const handleChange = (event) => {
    setChecked(event.target.checked);
    setSelectedDuplicate(
      event.target.checked && isOrgPresent
        ? orgDuplicates[orgProjects[0]]
          ? orgDuplicates[orgProjects[0]]
          : userDuplicates[userProjects[0]]
          ? userDuplicates[userProjects[0]]
          : ""
        : ""
    );
    setSelectedProject(
      event.target.checked && isOrgPresent ? orgProjects[0] : userProjects[0]
    );
    event.target.checked && !isOrgPresent ? setView(false) : setView(true);
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  let currentUserData = [];
  if (userProjects) {
    currentUserData = userProjects.slice(
      currentPage * itemsPerPage,
      (currentPage + 1) * itemsPerPage
    );
  }

  let currentOrgData = [];
  if (orgProjects) {
    currentOrgData = orgProjects.slice(
      currentPage * itemsPerPage,
      (currentPage + 1) * itemsPerPage
    );
  }

  const PinkSwitch = styled(Switch)(({ theme }) => ({
    "& .MuiSwitch-switchBase.Mui-checked": {
      color: "#c72c71",
      "&:hover": {
        backgroundColor: alpha("#c72c71", theme.palette.action.hoverOpacity),
      },
    },
    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
      backgroundColor: "#c72c71",
    },
  }));

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 14,
    },
  }));

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    "&:last-child td, &:last-child th": {
      border: 0,
    },
  }));

  const CustomTooltip = styled(({ className, ...props }) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
      color: Colors.brand.primarySubtle,
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: Colors.brand.primarySubtle,
      color: Colors.brand.primary,
    },
  }));

  const userHandler = (data) => {
    setSelectedProject(data);
    setSelectedDuplicate(userDuplicates[data.projectId]);
    setView(true);
  };

  const orgHandler = (data) => {
    setSelectedProject(data);
    setSelectedDuplicate(orgDuplicates[data.projectId]);
    setView(true);
  };

  return (
    <div>
      {!isLoading && userProjects && userProjects.length > 0 ? (
        <div>
          <div>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              style={{ marginTop: "1.3rem", marginLeft: "2rem" }}
            >
              <Typography>Individual</Typography>
              <PinkSwitch checked={checked} onChange={handleChange} />
              <Typography>Organisation</Typography>
            </Stack>
          </div>
          {checked && !isOrgPresent ? (
            <div className="h-full flex flex-col items-center justify-center">
              <h5 className="mb-3">No Organisation data present</h5>
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              justifyContent: "left",
            }}
          >
            {checked && !isOrgPresent ? null : (
              <div
                style={{
                  width: checked ? 600 : 550,
                  marginTop: "1.3rem",
                  marginLeft: "2rem",
                }}
              >
                <TableContainer component={Paper}>
                  <Table aria-label="customized table">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Project Name</StyledTableCell>
                        {checked ? (
                          <StyledTableCell align="center">
                            Created by
                          </StyledTableCell>
                        ) : null}
                        <StyledTableCell align="center">
                          Created date
                        </StyledTableCell>
                        <StyledTableCell align="right"></StyledTableCell>
                      </TableRow>
                    </TableHead>
                    {checked && isOrgPresent
                      ? currentOrgData.map((data) => (
                          <TableBody>
                            <StyledTableRow key={data.projectId}>
                              <StyledTableCell component="th" scope="row">
                                {data.projectName}
                                {orgDuplicates[data.projectId] ? (
                                  <CustomTooltip
                                    maxWidth={"10px"}
                                    arrow
                                    placement="right"
                                    title={<span>Found duplicates!</span>}
                                  >
                                    <IconButton aria-label="info">
                                      <InfoIcon
                                        color="error"
                                        fontSize="small"
                                      />
                                    </IconButton>
                                  </CustomTooltip>
                                ) : null}
                              </StyledTableCell>
                              <StyledTableCell
                                component="th"
                                scope="row"
                                align="center"
                              >
                                {data.username}
                              </StyledTableCell>
                              <StyledTableCell align="center">
                                {moment(data.createdDate).format("DD-MM-YYYY")}
                              </StyledTableCell>
                              <VisibilityIcon
                                style={{
                                  color: "#c72c71",
                                  margin: "1rem",
                                  marginLeft: "5rem",
                                }}
                                onClick={() => {
                                  orgHandler(data);
                                }}
                              />
                            </StyledTableRow>
                          </TableBody>
                        ))
                      : null}
                    {!checked
                      ? currentUserData.map((data) => (
                          <TableBody>
                            <StyledTableRow key={data.projectId}>
                              <StyledTableCell component="th" scope="row">
                                {data.projectName}
                                {userDuplicates[data.projectId] ? (
                                  <CustomTooltip
                                    maxWidth={"10px"}
                                    arrow
                                    placement="right"
                                    title={<span>Found duplicates</span>}
                                  >
                                    <IconButton aria-label="info">
                                      <InfoIcon
                                        color="error"
                                        fontSize="small"
                                      />
                                    </IconButton>
                                  </CustomTooltip>
                                ) : null}
                              </StyledTableCell>
                              <StyledTableCell align="center">
                                {moment(data.createdDate).format("DD-MM-YYYY")}
                              </StyledTableCell>
                              <VisibilityIcon
                                style={{
                                  color: "#c72c71",
                                  margin: "1rem",
                                  marginLeft: "5rem",
                                }}
                                onClick={() => {
                                  userHandler(data);
                                }}
                              />
                            </StyledTableRow>
                          </TableBody>
                        ))
                      : null}
                  </Table>
                </TableContainer>
                <div style={{ textAlign: "center" }}>
                  {!checked && userProjects ? (
                    <ReactPaginate
                      pageCount={Math.ceil(userProjects.length / itemsPerPage)}
                      onPageChange={handlePageChange}
                      containerClassName="pagination"
                      activeClassName="active"
                      previousLabel={<>&laquo;</>}
                      nextLabel={<>&raquo;</>}
                    />
                  ) : null}
                  {checked && orgProjects ? (
                    <ReactPaginate
                      pageCount={Math.ceil(orgProjects.length / itemsPerPage)}
                      onPageChange={handlePageChange}
                      containerClassName="pagination"
                      activeClassName="active"
                      previousLabel={<>&laquo;</>}
                      nextLabel={<>&raquo;</>}
                    />
                  ) : null}
                </div>
              </div>
            )}
            {selectedDuplicate ? (
              <div
                style={{
                  width: "35rem",
                  margin: "1rem",
                  display: view ? "block" : "none",
                }}
              >
                <TreeGraph
                  duplicates={selectedDuplicate}
                  project={selectedProject}
                  isOrgChecked={checked}
                />
              </div>
            ) : userProjects &&
              !userDuplicates &&
              !selectedProject &&
              !checked ? (
              <div
                style={{
                  width: "35rem",
                  margin: "1rem",
                  display: view ? "block" : "none",
                }}
              >
                <TreeGraph project={userProjects[0]} isOrgChecked={checked} />
              </div>
            ) : userProjects &&
              userDuplicates &&
              !selectedProject &&
              !checked ? (
              <div
                style={{
                  width: "35rem",
                  margin: "1rem",
                  display: view ? "block" : "none",
                }}
              >
                <TreeGraph
                  duplicates={userDuplicates[userProjects[0]]}
                  project={userProjects[0]}
                  isOrgChecked={checked}
                />
              </div>
            ) : selectedProject ? (
              <div
                style={{
                  width: "35rem",
                  margin: "1rem",
                  display: view ? "block" : "none",
                }}
              >
                <TreeGraph project={selectedProject} isOrgChecked={checked} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {isLoading ? <LoaderWithMessage message="Loading data" /> : null}
    </div>
  );
}
