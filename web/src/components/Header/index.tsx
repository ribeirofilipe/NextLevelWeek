import React from 'react';

interface HeaderProps {
  title: String;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header>
      <h1>{title}</h1>
    </header>
  );
}

export default Header;