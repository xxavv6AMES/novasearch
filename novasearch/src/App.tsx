import { useState } from 'react';
import { MantineProvider, Container, TextInput, Button, Title, Loader, Paper, Text, Group } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { searchBrave } from './api';
import { SearchResult } from './types';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const data = await searchBrave(query);
      setResults(data.web?.results || []);
    } catch (e: any) {
      setError('Failed to fetch results.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MantineProvider theme={{ colorScheme: 'dark' }} withGlobalStyles withNormalizeCSS>
      <Container size="sm" py="xl">
        <Title align="center" mb="lg" style={{ fontWeight: 900, letterSpacing: 1 }}>
          Nova Search
        </Title>
        <Group mb="md" position="apart" align="flex-end">
          <TextInput
            placeholder="Search the web..."
            value={query}
            onChange={e => setQuery(e.currentTarget.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            icon={<IconSearch size={18} />}
            style={{ flex: 1 }}
            size="md"
            autoFocus
          />
          <Button onClick={handleSearch} size="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
            Search
          </Button>
        </Group>
        {loading && <Loader mx="auto" my="xl" />}
        {error && <Text color="red" align="center">{error}</Text>}
        <div>
          {results.map((result, idx) => (
            <Paper key={idx} shadow="xs" p="md" mb="md" radius="md" withBorder>
              <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ color: '#7dd3fc', textDecoration: 'none' }}>
                <Text weight={700} size="lg">{result.title}</Text>
              </a>
              <Text size="sm" color="gray.4">{result.url}</Text>
              <Text mt="xs">{result.description}</Text>
            </Paper>
          ))}
        </div>
      </Container>
    </MantineProvider>
  );
}

export default App;
