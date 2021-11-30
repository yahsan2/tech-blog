import * as React from 'react';
import { Link } from 'gatsby';
import { Heading, Text } from '@chakra-ui/react';

interface Props {
  location: Location;
  title: string;
}

export const Layout: React.FC<Props> = ({ location, title, children }) => {
  const rootPath = '/';
  const isRootPath = location.pathname === rootPath;
  let header;

  if (isRootPath) {
    header = (
      <Heading as="h1" size="3xl">
        <Link to="/">{title}</Link>
      </Heading>
    );
  } else {
    header = (
      <Link className="header-link-home" to="/">
        {title}
      </Link>
    );
  }

  return (
    <div className="global-wrapper" data-is-root-path={isRootPath}>
      <header className="global-header">{header}</header>
      <main>{children}</main>
      <Text as="footer" size="md">
        © {new Date().getFullYear()}, Built with
        {` `}
        <Text
          as="a"
          size="md"
          color="#005C98"
          textDecoration="underline"
          href="https://www.gatsbyjs.com"
        >
          Gatsby
        </Text>
      </Text>
    </div>
  );
};
