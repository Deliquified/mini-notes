"use client";

import { ReactNode } from "react";
import { UpProvider } from "./upProvider";
import { Toaster } from "sonner";
import { ApolloProvider } from '@apollo/client';
import { client } from '../apollo/apolloClient';
import { ProfileProvider } from "./profileProvider";
import { NotesProvider } from "./notesProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <UpProvider>
        <ApolloProvider client={client}>
          <NotesProvider>
            <ProfileProvider>
              <Toaster />
              {children}
            </ProfileProvider>
          </NotesProvider>
        </ApolloProvider>
    </UpProvider>
  );
}