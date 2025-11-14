import { Avatar, Paper } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { useLogout } from '../shared/query/authQueries';
import routes from '../shared/routes';
import { isUserLoggedIn } from '../shared/utils';
import ezLogo from '../static/images/logo/connectoLogo.svg';
import visualImg from '../static/images/visual.jpg';

function Copyright() {
    return (
        <Typography variant="body2" color="textSecondary" align="center">
            {'Copyright © '}
            <Link color="inherit" href="https://material-ui.com/">
                Your Website
            </Link>{' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    );
}

const useStyles = makeStyles((theme) => ({
    '@global': {
        ul: {
            margin: 0,
            padding: 0,
            listStyle: 'none',
        },
    },
    appBar: {
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    toolbar: {
        flexWrap: 'wrap',
    },
    toolbarTitle: {
        flexGrow: 1,
    },
    link: {
        margin: theme.spacing(1, 1.5),
    },
    heroContent: {
        padding: theme.spacing(6, 0, 4),
    },
    heroContent1: {
        padding: theme.spacing(6, 0, 0),
    },
    cardHeader: {
        backgroundColor: theme.palette.type === 'light' ? theme.palette.grey[200] : theme.palette.grey[700],
    },
    cardPricing: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'baseline',
        marginBottom: theme.spacing(2),
    },
    footer: {
        borderTop: `1px solid ${theme.palette.divider}`,
        marginTop: theme.spacing(8),
        paddingTop: theme.spacing(3),
        paddingBottom: theme.spacing(3),
        [theme.breakpoints.up('sm')]: {
            paddingTop: theme.spacing(6),
            paddingBottom: theme.spacing(6),
        },
    },
    fullImage: {
        width: '100%',
        height: '250px',
    },
    fullImage1: {
        width: '100%',
        height: '200px',
    },
    textStyle: {
        width: '100%',
        height: '100%',
    },
}));

const tiers = [
    {
        title: 'Free',
        price: '0',
        description: ['10 users included', '2 GB of storage', 'Help center access', 'Email support'],
        buttonText: 'Sign up for free',
        buttonVariant: 'outlined',
    },
    {
        title: 'Pro',
        subheader: 'Most popular',
        price: '15',
        description: ['20 users included', '10 GB of storage', 'Help center access', 'Priority email support'],
        buttonText: 'Get started',
        buttonVariant: 'contained',
    },
    {
        title: 'Enterprise',
        price: '30',
        description: ['50 users included', '30 GB of storage', 'Help center access', 'Phone & email support'],
        buttonText: 'Contact us',
        buttonVariant: 'outlined',
    },
];
const footers = [
    {
        title: 'Company',
        description: ['Team', 'History'],
    },
    {
        title: 'Features',
        description: ['Team feature', 'Developer stuff'],
    },
    {
        title: 'Legal',
        description: ['Privacy policy', 'Terms of use'],
    },
];

export default function Landing() {
    const classes = useStyles();
    const isUserLogged = isUserLoggedIn();

    const { mutate: logout } = useLogout();

    return (
        <React.Fragment>
            <CssBaseline />
            <AppBar position="static" color="primary" elevation={0} className={classes.appBar}>
                <Toolbar className={classes.toolbar}>
                    <Avatar
                        className={classes.bigAvatar}
                        src={ezLogo}
                        variant="rounded"
                        style={{ marginRight: '1rem' }}
                    />

                    <Typography variant="h6" color="inherit" noWrap className={classes.toolbarTitle}>
                        CONEKTTO
                    </Typography>

                    <nav>
                        <Link variant="button" color="inherit" href="#" className={classes.link}>
                            Product
                        </Link>
                        <Link variant="button" color="inherit" href="#" className={classes.link}>
                            Company
                        </Link>
                        <Link variant="button" color="inherit" href="#" className={classes.link}>
                            Contact Us
                        </Link>
                        <Link variant="button" color="inherit" href="#" className={classes.link}>
                            Pricing
                        </Link>
                    </nav>
                    {isUserLogged ? (
                        <Button onClick={logout} color="inherit" variant="outlined" className={classes.link}>
                            Logout
                        </Button>
                    ) : (
                        <Button href={routes.signIn} color="inherit" variant="outlined" className={classes.link}>
                            Login
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
            {/* Hero unit */}

            <Container maxWidth="sm" component="main" className={classes.heroContent}>
                <Typography component="h5" variant="h5" align="center" color="textPrimary" gutterBottom>
                    Get to know about CONEKTTO
                </Typography>
            </Container>

            <Container maxWidth="md" component="main" className={classes.heroContent}>
                <Typography component="h5" variant="h5" align="center" color="textPrimary" gutterBottom>
                    Visualization
                </Typography>
                <Paper>
                    <Box pt={2} pb={2}></Box>

                    <Grid container spacing={5} alignItems="flex-end">
                        <Grid item xs={12} sm={6} md={6}>
                            <Box pl={4} pr={4}>
                                <Typography color="textPrimary" gutterBottom className={classes.textStyle}>
                                    "In the digital era, doing business online is easy and simplified. APIs and 3rd
                                    party APIs have been the center pivot of all online interactions and integrations.
                                    Business powered technology and innovation is the next big transformation. Yet, API
                                    development is ages behind in bringing the citizen developer empowerment. Designing
                                    an API anymore should be in the context of business, products and services as
                                    against standards in API specification. Visualization and knowledge respresentation
                                    of API specification today is in stone age. CONEKTTO brings simplicity and ease to
                                    the whole API ecosystem." &nbsp;&nbsp;&nbsp;&nbsp; Go visualize @ conektto !!.
                                    <br />
                                    Hashtag: #conektto_visualize, #conektto"
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                            <img className={classes.fullImage1} src={visualImg} alt="EZ API" />
                        </Grid>
                    </Grid>
                </Paper>
            </Container>

            {/* Footer */}
            <Container maxWidth="md" component="footer" className={classes.footer}>
                <Grid container spacing={4} justify="space-evenly">
                    {footers.map((footer) => (
                        <Grid item xs={6} sm={3} key={footer.title}>
                            <Typography variant="h6" color="textPrimary" gutterBottom>
                                {footer.title}
                            </Typography>
                            <ul>
                                {footer.description.map((item) => (
                                    <li key={item}>
                                        <Link href="#" variant="subtitle1" color="textSecondary">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </Grid>
                    ))}
                </Grid>
                <Box mt={5}>
                    <Copyright />
                </Box>
            </Container>
            {/* End footer */}
        </React.Fragment>
    );
}
