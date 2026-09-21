import React from 'react';

const PageWrapper = ({ children }) => (
  <div className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col">
    <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
      {children}
    </main>
  </div>
);

export default PageWrapper;