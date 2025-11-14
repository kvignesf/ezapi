import { Tab, Tabs } from '@material-ui/core';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { PrimaryButton } from '../shared/components/AppButton';
import TabLabel from '../shared/components/TabLabel';

const styles = (theme) => ({
    root: {
        marginRight: 8,
        '& .MuiInputBase-root.Mui-disabled': {
            color: 'green', // (default alpha is 0.38)
        },
    },
});
const Simulate = ({ simulateData }, props) => {
    const APIColor = {
        get: '#71c72c',
        post: '#ff8800',
        patch: '#2c71c7',
        delete: '#e53535',
        put: '#2c71c7',
        trace: '#71c72c',
        head: '#71c72c',
    };
    const [currentTab, setCurrentTab] = useState(0);
    const [textBoxValue, setTextBoxValue] = useState();
    const [responseData, setResponseData] = useState('');
    const [apiButtonColor, setApiButtonColor] = useState('get');

    useEffect(() => {
        setApiButtonColor(APIColor[simulateData?.httpMethod]);
        // console.log(simulateData);

        switch (currentTab) {
            case 0:
                setTextBoxValue(JSON.stringify(simulateData?.formData, null, 4));
                break;
            case 1:
                setTextBoxValue(JSON.stringify(simulateData?.headers, null, 4));
                break;
            case 2:
                setTextBoxValue(JSON.stringify(simulateData?.requestBody, null, 4));
                break;
            default:
                setTextBoxValue(JSON.stringify(simulateData?.formData, null, 4));
        }
    }, [currentTab, simulateData]);
    useEffect(() => {
        if (simulateData?.responseBody !== responseData) {
            setResponseData('');
        }
    }, [simulateData]);
    const height = 42;

    const labelOffset = -6;

    const focused = true;
    return (
        <div className="flex-1 relative w-full p-2">
            <div className="h-1/2 mb-3">
                {' '}
                <div className=" flex flex-row gap-2 mr-52">
                    <Button
                        disableElevation
                        disableRipple
                        variant="outlined"
                        size="small"
                        sx={{
                            color: apiButtonColor,
                            ml: 1,
                            '&.MuiButtonBase-root:hover': {
                                background: 'none',
                                borderColor: apiButtonColor,
                                cursor: 'default',
                            },
                            borderColor: apiButtonColor,
                        }}
                    >
                        {simulateData ? simulateData?.httpMethod.toUpperCase() : 'GET'}
                    </Button>

                    <TextField
                        // inputProps={{ readOnly: true }}
                        placeholder="Endpoint"
                        className={styles('').root}
                        key={simulateData}
                        fullWidth
                        variant="outlined"
                        /* styles the wrapper */
                        style={{ height }}
                        /* styles the label component */
                        InputLabelProps={{
                            style: {
                                height,
                                ...(!focused && { top: `${labelOffset}px` }),
                            },
                        }}
                        /* styles the input component */
                        inputProps={{
                            readOnly: true,
                            style: {
                                height,
                                padding: '0 14px',
                            },
                        }}
                        value={simulateData?.endpoint}
                    />
                    <PrimaryButton
                        onClick={() => {
                            if (document.getElementById('responseBodyTextField').value == '' && responseData == '') {
                                setResponseData(JSON.stringify(simulateData?.responseBody, null, 4));
                            } else {
                                document.getElementById('responseBodyTextField').value = '';
                                setTimeout(() => {
                                    setResponseData(JSON.stringify(simulateData?.responseBody, null, 4));
                                    document.getElementById('responseBodyTextField').value = responseData;
                                }, 250);
                            }
                        }}
                    >
                        SEND
                    </PrimaryButton>
                </div>
                <div>
                    <div className=" flex flex-row mb-1">
                        {' '}
                        <Tabs
                            value={currentTab}
                            onChange={(_, index) => {
                                setCurrentTab(index);
                            }}
                            aria-label="add project tabs"
                            indicatorColor="primary"
                            textColor="primary"
                        >
                            <Tab label={<TabLabel label={'Form Data'} />} style={{ outline: 'none', border: 'none' }} />

                            <Tab label={<TabLabel label={'Headers'} />} style={{ outline: 'none', border: 'none' }} />

                            <Tab
                                label={<TabLabel label={'Request Body'} />}
                                style={{ outline: 'none', border: 'none' }}
                            />
                        </Tabs>
                    </div>

                    <TextField
                        inputProps={{ readOnly: true }}
                        key={simulateData}
                        fullWidth
                        // style={{ width: 1375 }}
                        // id='responseBodyTextField'
                        multiline
                        rows={11}
                        value={textBoxValue}
                    />
                </div>
            </div>

            <div className="h-1/2 ">
                {' '}
                <div className=" flex flex-row mb-1">
                    <Tabs
                        value={0}
                        aria-label="add project tabs"
                        indicatorColor="primary"
                        textColor="primary"
                        style={{ width: 'min-content' }}
                    >
                        <Tab
                            label={<TabLabel label={'Response Body'} />}
                            // style={{
                            //   borderRight: `2px solid ${Colors.neutral.gray6}`,
                            //   outline: "none",
                            // }}
                        />
                    </Tabs>
                </div>
                <div className=" h-full">
                    {' '}
                    {/* <p className='p-2'>Status : 200</p> */}
                    <TextField
                        inputProps={{ readOnly: true }}
                        key={simulateData}
                        fullWidth
                        // style={{ width: 1375, height: 400 }}
                        id="responseBodyTextField"
                        multiline
                        rows={11}
                        value={responseData}
                    />
                </div>
            </div>
        </div>
    );
};

export default Simulate;
