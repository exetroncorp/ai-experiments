/** @jsxImportSource https://esm.sh/react */
import React, { useState, useEffect, useCallback } from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";
import debounce from "https://esm.sh/lodash.debounce";
import { motion, AnimatePresence } from "https://esm.sh/framer-motion";

interface PortMapping {
  id: number;
  port: number;
  subdomain: string;
  cloudIdeUrl: string;
}

function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="flex justify-end">
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                &times;
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function App() {
  const [mappings, setMappings] = useState<PortMapping[]>([]);
  const [newMapping, setNewMapping] = useState<Omit<PortMapping, 'id'>>({ port: 0, subdomain: '', cloudIdeUrl: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    try {
      const response = await fetch('/mappings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMappings(data);
      setError(null);
    } catch (e) {
      console.error("Failed to fetch mappings:", e);
      setError("Failed to load mappings. Please try again later.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMapping),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNewMapping({ port: 0, subdomain: '', cloudIdeUrl: '' });
      setIsModalOpen(false);
      fetchMappings();
    } catch (e) {
      console.error("Failed to add new mapping:", e);
      setError("Failed to add new mapping. Please try again.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/mappings/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchMappings();
    } catch (e) {
      console.error("Failed to delete mapping:", e);
      setError("Failed to delete mapping. Please try again.");
    }
  };

  const handleOpen = (mapping: PortMapping) => {
    window.open(`https://${mapping.subdomain}.${mapping.cloudIdeUrl}:${mapping.port}`, '_blank');
  };

  const handleShare = async (mapping: PortMapping) => {
    const url = `https://${mapping.subdomain}.${mapping.cloudIdeUrl}:${mapping.port}`;
    setSharedUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess("URL copied to clipboard!");
      setTimeout(() => setCopySuccess(null), 3000); // Clear the success message after 3 seconds
    } catch (err) {
      console.error("Failed to copy URL: ", err);
      setCopySuccess("Failed to copy URL. Please try again.");
    }
  };

  const debouncedUpdate = useCallback(
    debounce(async (mapping: PortMapping) => {
      try {
        const response = await fetch(`/mappings/${mapping.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mapping),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (e) {
        console.error("Failed to update mapping:", e);
        setError("Failed to update mapping. Please try again.");
      }
    }, 500),
    []
  );

  const handleInlineEdit = (id: number, field: keyof PortMapping, value: string | number) => {
    const updatedMappings = mappings.map(mapping => 
      mapping.id === id ? { ...mapping, [field]: value } : mapping
    );
    setMappings(updatedMappings);
    const updatedMapping = updatedMappings.find(m => m.id === id);
    if (updatedMapping) {
      debouncedUpdate(updatedMapping);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-roboto">
      <div className="max-w-6xl mx-auto">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold mb-8 text-center text-blue-400"
        >
          Port Forward Manager
        </motion.h1>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-red-600 text-white p-4 rounded mb-4"
          >
            {error}
          </motion.div>
        )}
        {copySuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-green-600 text-white p-4 rounded mb-4"
          >
            {copySuccess}
          </motion.div>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Add New Mapping
        </motion.button>
        <div className="overflow-x-auto">
          <table className="w-full bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Port</th>
                <th className="px-4 py-3 text-left">Subdomain</th>
                <th className="px-4 py-3 text-left">Cloud IDE URL</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {mappings.map((mapping) => (
                  <motion.tr
                    key={mapping.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="border-b border-gray-700"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={mapping.port}
                        onChange={(e) => handleInlineEdit(mapping.id, 'port', parseInt(e.target.value))}
                        className="bg-gray-700 text-white px-2 py-1 rounded w-full"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={mapping.subdomain}
                        onChange={(e) => handleInlineEdit(mapping.id, 'subdomain', e.target.value)}
                        className="bg-gray-700 text-white px-2 py-1 rounded w-full"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={mapping.cloudIdeUrl}
                        onChange={(e) => handleInlineEdit(mapping.id, 'cloudIdeUrl', e.target.value)}
                        className="bg-gray-700 text-white px-2 py-1 rounded w-full"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(mapping.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded mr-2"
                      >
                        Delete
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpen(mapping)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2"
                      >
                        Open
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleShare(mapping)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded"
                      >
                        Share
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <AnimatePresence>
          {sharedUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 p-4 bg-gray-800 rounded"
            >
              <h3 className="text-lg font-semibold mb-2">Shared URL:</h3>
              <p className="break-all">{sharedUrl}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <a href={import.meta.url.replace("esm.town", "val.town")} target="_top" className="inline-block mt-8 text-blue-400 hover:text-blue-300">View Source</a>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className="text-2xl font-bold mb-4 text-white">Add New Mapping</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="port" className="block text-sm font-medium text-gray-400">Port:</label>
            <input
              id="port"
              type="number"
              value={newMapping.port}
              onChange={(e) => setNewMapping({ ...newMapping, port: parseInt(e.target.value) })}
              required
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
            />
          </div>
          <div>
            <label htmlFor="subdomain" className="block text-sm font-medium text-gray-400">Subdomain:</label>
            <input
              id="subdomain"
              type="text"
              value={newMapping.subdomain}
              onChange={(e) => setNewMapping({ ...newMapping, subdomain: e.target.value })}
              required
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
            />
          </div>
          <div>
            <label htmlFor="cloudIdeUrl" className="block text-sm font-medium text-gray-400">Cloud IDE URL:</label>
            <input
              id="cloudIdeUrl"
              type="text"
              value={newMapping.cloudIdeUrl}
              onChange={(e) => setNewMapping({ ...newMapping, cloudIdeUrl: e.target.value })}
              required
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Mapping
          </motion.button>
        </form>
      </Modal>
    </div>
  );
}

function client() {
  createRoot(document.getElementById("root")).render(<App />);
}

if (typeof document !== "undefined") { client(); }

export default async function server(request: Request): Promise<Response> {
  const { blob } = await import("https://esm.town/v/std/blob");
  const KEY = new URL(import.meta.url).pathname.split("/").at(-1);
  const CONFIG_KEY = `${KEY}_config.json`;

  async function readConfig() {
    try {
      const data = await blob.getJSON(CONFIG_KEY);
      if (Array.isArray(data)) {
        return data as PortMapping[];
      } else {
        console.error("Invalid config data:", data);
        return [];
      }
    } catch (error) {
      console.error("Error reading config:", error);
      return [];
    }
  }

  async function writeConfig(config: PortMapping[]) {
    await blob.setJSON(CONFIG_KEY, config);
  }

  // Initialize config if it doesn't exist
  const initConfig = async () => {
    const existingConfig = await readConfig();
    if (existingConfig.length === 0) {
      await writeConfig([]);
    }
  };

  await initConfig();

  const url = new URL(request.url);
  if (url.pathname === '/mappings' && request.method === 'GET') {
    const config = await readConfig();
    return new Response(JSON.stringify(config), { headers: { 'Content-Type': 'application/json' } });
  } else if (url.pathname === '/mappings' && request.method === 'POST') {
    const config = await readConfig();
    const newMapping = await request.json();
    newMapping.id = config.length > 0 ? Math.max(...config.map(m => m.id)) + 1 : 1;
    config.push(newMapping);
    await writeConfig(config);
    return new Response(null, { status: 201 });
  } else if (url.pathname.startsWith('/mappings/') && request.method === 'PUT') {
    const id = parseInt(url.pathname.split('/').pop());
    const updatedMapping = await request.json();
    const config = await readConfig();
    const index = config.findIndex(m => m.id === id);
    if (index !== -1) {
      config[index] = { ...config[index], ...updatedMapping };
      await writeConfig(config);
      return new Response(null, { status: 200 });
    }
    return new Response(null, { status: 404 });
  } else if (url.pathname.startsWith('/mappings/') && request.method === 'DELETE') {
    const id = parseInt(url.pathname.split('/').pop());
    const config = await readConfig();
    const newConfig = config.filter(m => m.id !== id);
    await writeConfig(newConfig);
    return new Response(null, { status: 200 });
  }

  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Port Forward Manager</title>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              fontFamily: {
                'roboto': ['Roboto', 'sans-serif'],
              }
            }
          }
        }
      </script>
      <style>
        body {
          font-family: 'Roboto', sans-serif;
        }
      </style>
    </head>
    <body>
      <div id="root"></div>
      <script src="https://esm.town/v/std/catch"></script>
      <script type="module" src="${import.meta.url}"></script>
    </body>
    </html>
  `,
  {
    headers: {
      "content-type": "text/html",
    },
  });
}
