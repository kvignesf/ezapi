import { Drawer, makeStyles } from '@material-ui/core';
import { useState } from 'react';
import { Resizable } from 'react-resizable';
import CollectionTabs from './CollectionTabs/CollectionTabs';
import DocStore from './DocStore/DocStore';
const drawerWidth = 300;
const maxSidebarWidth = 550;

export default function Collections() {
    const [sidebarWidth, setSidebarWidth] = useState(drawerWidth);

    const useStyles = makeStyles((theme) => ({
        root: {
            display: 'flex',
            height: '95vh',
            overflow: 'hidden',
        },
        appBar: {
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: theme.palette.primary.main,
        },
        drawer: {
            width: sidebarWidth,
            flexShrink: 0,
        },
        drawerPaper: {
            width: sidebarWidth,
            borderRight: 'none',
        },
        drawerContainer: {
            overflow: 'auto',
        },
        content: ({ sidebarWidth }) => ({
            flexGrow: 1,
            width: `calc(100% - ${sidebarWidth}px)`,
        }),
        resizable: {
            position: 'relative',
            '& .react-resizable-handle': {
                position: 'absolute',
                top: 0,
                right: 0,
                width: '2px',
                height: '100%',
                cursor: 'col-resize',
                zIndex: 1,
                backgroundColor: '#E6E7E5',
                transition: 'background-color 0.2s ease-in-out',
            },
            '& .react-resizable-handle:hover': {
                width: '5px',
                backgroundColor: '#20262E',
            },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#20262E',
            },
        },
    }));
    const classes = useStyles({ sidebarWidth });

    const handleResize = (e, { size }) => {
        if (size.width <= maxSidebarWidth) {
            setSidebarWidth(size.width);
        }
    };

    return (
        <div>
            <div className={classes.root}>
                <Resizable
                    width={sidebarWidth}
                    height={window.innerHeight}
                    minConstraints={[drawerWidth, 0]}
                    maxConstraints={[maxSidebarWidth, 0]}
                    onResize={handleResize}
                    className={classes.resizable}
                >
                    <Drawer
                        className={classes.drawer}
                        variant="permanent"
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                    >
                        <DocStore isModal={false} />
                    </Drawer>
                </Resizable>
                <main className={classes.content}>
                    <CollectionTabs />
                </main>
            </div>
        </div>
    );
}
