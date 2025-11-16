const WorkOS = require('@workos-inc/node').default;
const workos = new WorkOS(process.env.WORKOS_API_KEY);

const getOrgID = async (domain) => {
	// Make call to listOrganizations and filter using the domain passed in by user.
	const organizations = await workos.organizations.listOrganizations({
		domains: domain
	});

	// If no organizations exist with that domain:
	if (organizations.data.length === 0) {
		return { error: 'No organization exist with entered domain name' };
	}
	// If an organization does exist with the domain, use that organization for the connection.
	else {
		global.organization = organizations.data[0];
		const orgId = global.organization.id;
		return { orgId: orgId };
	}
};

module.exports = getOrgID;
