import { Dialog, Snackbar } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import Alert from '@mui/material/Alert';
import _ from 'lodash';
import { PrimaryButton } from '../shared/components/AppButton';
import client, { endpoint } from '../shared/network/client';
import { getAccessToken } from '../shared/storage';
// import Snackbar from '@material-ui/core/Snackbar';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import React from 'react';
import Dashboard from '../Dashboard';
import AppIcon from '../shared/components/AppIcon';
import ErrorWithMessage from '../shared/components/ErrorWithMessage';
import LoaderWithMessage from '../shared/components/LoaderWithMessage';
import EmptyLogo from '../static/images/empty-state.svg';
import OrderRow from './OrderRow';
import { useGetOrders } from './ordersQueries';

const Content = () => {
    const [status, setStatus] = React.useState(false);
    const [data, setData] = React.useState();
    const acc_token = getAccessToken();
    const handleUnsubscribe = async () => {
        try {
            const { unsubscribeData, status } = await client.post(endpoint.unSubscribe, {
                headers: {
                    Authorization: acc_token,
                },
            });
            // console.log(status);
            if (status == 200 || status == '200') {
                setStatus(true);
                setFailureAlert(false);
                setSuccessAlert(true);
            }
            // return unsubscrifbeData;
        } catch (error) {
            if (error.response.status == 400) {
                setData(error.response.data);
                setStatus(false);
                setFailureAlert(true);
                setSuccessAlert(false);
            }
            // console.log(error.response.status)
        }

        // if (status == 'success') {
        //   return true;
        // } else if (status == 'error') {
        //   return false;
        // }
    };
    // const useHandleUnsubscribe = () => {
    //   return useQuery('key', handleUnsubscribe, {
    //     refetchOnWindowFocus: false,
    //   });
    // };

    // const isTrial = async () => {
    //   const { userProfileData } = await client.post(endpoint.userProfile, {
    //     headers: {
    //       Authorization: acc_token,
    //     },
    //   });
    //   console.log(userProfileData);
    //   if (userProfileData?.subscribed_price == '') return true;
    //   else return false;
    // };
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [unsubscribeDialogBox, setUnsubscribeDialogBox] = React.useState(false);
    const [successAlert, setSuccessAlert] = React.useState(false);
    const [failureAlert, setFailureAlert] = React.useState(false);
    const {
        data: ordersData,
        isLoading: isFetchingOrders,
        error: fetchOrdersError,
        isFetching: isFetchingOrdersBg,
        refetch: refetchOrders,
    } = useGetOrders();
    const handleOnOptionsClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setUnsubscribeDialogBox(false);
        setSuccessAlert(false);
    };
    return (
        <div className="p-3 h-full">
            {/* <Dialog
        onClose={handleCloseDialog}
        aria-labelledby='projects-dialog'
        open={dialog?.show ?? false}
        fullWidth
        PaperProps={{
          style: { borderRadius: 8 },
        }}
        disableBackdropClick
      >
        {dialog?.type === "members" && (
          <ModifyCollaborators
            projectId={dialog?.data?.projectId}
            onClose={handleCloseDialog}
            invitedCollaborators={dialog?.data?.members}
          />
        )}

        {dialog?.type === "rename-project" && (
          <RenameProject onClose={handleCloseDialog} project={dialog?.data} />
        )}

        {dialog?.type === "del-project" && (
          <DeleteProject onClose={handleCloseDialog} project={dialog?.data} />
        )}
      </Dialog> */}
            {/* <Alert severity="success">This is a success alert — check it out!</Alert> */}
            {isFetchingOrders && <LoaderWithMessage message="Fetching orders" />}

            {fetchOrdersError && <ErrorWithMessage message="Failed to load orders" />}

            {!_.isEmpty(ordersData) && (
                <table className="w-full table-fixed">
                    <tr className=" bg-neutral-gray6  text-center w-full text-neutral-gray4 text-mediumLabel ">
                        {/* <th className="p-2 rounded-tl-md rounded-bl-md uppercase">
              Project Id
            </th> */}
                        {/* <th className="p-2 rounded-tl-md rounded-bl-md uppercase">
              Project Name
            </th> */}
                        <th align="left" className="  uppercase w-72 ">
                            Order Id
                        </th>
                        <th align="left" className=" uppercase w-36">
                            Order Date
                        </th>
                        <th align="left" className="uppercase w-48 ">
                            Payment Status
                        </th>
                        <th align="left" className="uppercase w-30">
                            Price
                        </th>
                        <th align="left" className=" uppercase w-30">
                            Invoice
                        </th>
                        {/* <th className="p-2 w-36 uppercase">Subscription</th> */}

                        <td className="">
                            <AppIcon onClick={handleOnOptionsClick}>
                                <MoreVertIcon />
                            </AppIcon>
                        </td>

                        {/* <th className="rounded-tr-md rounded-br-md text-center">
              {isFetchingOrdersBg ? (
                <CircularProgress size="20px" />
              ) : (
                <Tooltip title="Refresh list">
                  <ReplayIcon
                    style={{
                      width: '20px',
                      height: '20px',
                      color: Colors.brand.primary,
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e?.preventDefault();
                      e?.stopPropagation();
                      refetchOrders();
                    }}
                  />
                </Tooltip>
              )}
            </th> */}
                        <Menu
                            anchorEl={anchorEl}
                            keepMounted
                            open={Boolean(anchorEl)}
                            onClose={() => {
                                setAnchorEl(null);
                            }}
                            // TransitionComponent={Fade}
                            style={{ borderRadius: '1rem' }}
                        >
                            {/* <MenuItem
                onClick={(e) => {
                  e?.preventDefault();
                  e?.stopPropagation();
                  refetchOrders();
                  setAnchorEl(null);
                  // handleOnView(project);
                }}
              >
                Refresh
              </MenuItem> */}
                            <MenuItem
                                onClick={() => {
                                    setSuccessAlert(false);
                                    setUnsubscribeDialogBox(true);
                                    setAnchorEl(null);
                                    setFailureAlert(false);
                                }}
                            >
                                Cancel Subscription
                            </MenuItem>
                        </Menu>
                    </tr>

                    {/* <Dialog
            aria-labelledby="unsubscribe-dialog"
            open={unsubscribeDialogBox}
            fullWidth
            PaperProps={{
              style: { borderRadius: 8 },
            }}
            disableBackdropClick
          >
            {' '}
            <AppIcon
              onClick={(e) => {
                e?.preventDefault();
                e?.stopPropagation();

                setUnsubscribeDialogBox(false);
              }}
            >
              <CloseIcon />
            </AppIcon>
            <h1>dialog box test</h1>
          </Dialog> */}

                    <Dialog
                        aria-labelledby="dashboard-dialog"
                        open={unsubscribeDialogBox}
                        // maxWidth={5000}
                        PaperProps={{
                            style: { borderRadius: 8 },
                        }}
                        onClose={(event, reason) => {
                            if (reason !== 'backdropClick') {
                                setUnsubscribeDialogBox;
                            }
                        }}
                    >
                        <div className="p-4">
                            <div className="flex flex-row items-center justify-between mb-3">
                                <h6>Unsubscribe</h6>
                                <AppIcon aria-label="close" onClick={() => setUnsubscribeDialogBox(false)}>
                                    <CloseIcon />
                                </AppIcon>
                            </div>
                            Are you sure you want to Unsubscribe?
                            <div className="border-t-2 border-neutral-gray7 flex flex-row gap-5  items-center justify-end pt-4 px-4">
                                {' '}
                                <PrimaryButton
                                    style={{
                                        maxWidth: '70px',
                                        maxHeight: '50px',
                                        minWidth: '30px',
                                        minHeight: '30px',
                                    }}
                                    onClick={() => {
                                        setUnsubscribeDialogBox(false);
                                    }}
                                    classes="flex-1 -ml-4 text-brand-secondary"
                                >
                                    NO
                                </PrimaryButton>
                                <PrimaryButton
                                    style={{
                                        maxWidth: '70px',
                                        maxHeight: '50px',
                                        minWidth: '30px',
                                        minHeight: '30px',
                                    }}
                                    onClick={() => {
                                        handleUnsubscribe();
                                    }}
                                    classes="flex-1 -ml-4 text-brand-secondary"
                                >
                                    YES
                                </PrimaryButton>
                                {successAlert && (
                                    <Snackbar
                                        open={successAlert}
                                        autoHideDuration={3000}
                                        onClose={handleClose}
                                        // action={action}
                                    >
                                        <Alert severity="success" sx={{ width: '100%' }}>
                                            Successfully Cancelled Subscription
                                        </Alert>
                                    </Snackbar>
                                )}
                                {failureAlert && (
                                    <Snackbar
                                        open={failureAlert}
                                        autoHideDuration={3000}
                                        onClose={handleClose}
                                        // action={action}
                                    >
                                        <Alert severity="error" sx={{ width: '100%' }}>
                                            {data?.message}
                                        </Alert>
                                    </Snackbar>
                                )}
                            </div>
                        </div>
                    </Dialog>

                    {ordersData.map((order) => {
                        return <OrderRow order={order} />;
                    })}
                </table>
            )}

            {/* Empty state */}
            {_.isEmpty(ordersData) && (
                <div className="h-full flex flex-col items-center justify-center">
                    <img src={EmptyLogo} className="mb-4" style={{ width: '100px', height: '100px' }} />

                    <h5 className="mb-3">There are no orders</h5>
                </div>
            )}
        </div>
    );
};

const Orders = () => {
    return (
        <Dashboard selectedIndex={2}>
            <Content />
        </Dashboard>
    );
};

export default Orders;
