import { withStyles } from '@material-ui/core';
import TreeItem from '@material-ui/lab/TreeItem';
import Colors from '../../shared/colors';

const StyledTreeItem = withStyles((theme) => ({
    selected: {
        '&:focus': {
            backgroundColor: 'null',
        },
        '&:hover': {
            backgroundColor: 'null',
        },
    },
    group: {
        marginLeft: 8,
        paddingLeft: 8,
        borderLeft: `1px solid ${Colors.neutral.gray5}`,
    },
}))((props) => <TreeItem style={{ marginTop: '0.5rem' }} {...props} />);

export default StyledTreeItem;
