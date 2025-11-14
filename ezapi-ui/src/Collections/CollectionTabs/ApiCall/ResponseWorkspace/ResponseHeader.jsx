import { makeStyles, Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
    table: {
        marginTop: theme.spacing(1),
    },
    headerCell: {
        fontWeight: 'bold',
    },
}));

export default function ResponseHeader({ response }) {
    const classes = useStyles();
    const responseHeaders = [];

    if (!(response == null)) {
        if ('headers' in response) {
            Object.entries(response.headers).forEach(([key, value]) => {
                responseHeaders.push({
                    key: key,
                    value: value,
                });
            });
        }
    }

    return (
        <Table className={classes.table}>
            <TableHead>
                <TableRow>
                    <TableCell className={classes.headerCell} align="left" width="30%">
                        Key
                    </TableCell>
                    <TableCell className={classes.headerCell} align="left">
                        Value
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {responseHeaders.map(({ key, value }, index) => (
                    <TableRow key={index}>
                        <TableCell align="left">{key}</TableCell>
                        <TableCell align="left">{value}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
