import React, { useState, useMemo } from "react";
import { UserStory, userStories } from "../lib/stories";

const UserStoryCard: React.FC<{
  story: UserStory;
  onImageClick: (imageUrl: string) => void;
}> = ({ story, onImageClick }) => {
  return (
    <div className={`relative border rounded-lg p-4 mb-4 shadow-sm bg-white`}>
      {story.image && (
        <div
          className="mb-2 cursor-pointer"
          onClick={() => onImageClick(story.image!)}
        >
          <img
            src={story.image}
            alt={story.specificTitle}
            className="w-full h-auto"
          />
        </div>
      )}
      <h3 className="text-xs font-semibold mb-1 text-gray-500 uppercase tracking-wider">
        {story.epic}
      </h3>
      <h4 className="text-sm font-bold mb-1">
        {story.fullTitleHeader}
        {story.specificTitle && story.specificTitle !== story.fullTitleHeader
          ? ` - ${story.specificTitle}`
          : ""}
      </h4>
      {story.description && (
        <p className="text-xs text-gray-700 mb-2">{story.description}</p>
      )}
      {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-800 mb-1">
            Acceptance Criteria:
          </p>
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 pl-2">
            {story.acceptanceCriteria.map((criterion, index) => (
              <li key={index} className="whitespace-pre-wrap">
                {criterion}
              </li>
            ))}
          </ul>
        </div>
      )}
      {story.estimation && (
        <p className="text-xs font-semibold text-blue-600">
          Story points: {story.estimation}
        </p>
      )}
    </div>
  );
};

const UserStoriesSidebar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null); 
  const [isViewerOpen, setIsViewerOpen] = useState(false); 

  const allStories = useMemo(
    () => userStories.filter((story) => !story.isBacklog),
    [],
  );

  const filteredStories = useMemo(() => {
    if (!searchTerm) {
      return allStories;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return allStories.filter((story) =>
      story.rawContent.toLowerCase().includes(lowerCaseSearchTerm),
    );
  }, [allStories, searchTerm]);

  
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsViewerOpen(true);
  };

  
  const closeViewer = () => {
    setIsViewerOpen(false);
    setSelectedImage(null);
  };

  return (
    <div className="w-1/4 p-4 border-r border-gray-300 overflow-hidden bg-white flex flex-col h-full relative">
      {" "}
      <p className="font-semibold flex-shrink-0">Past User Stories</p>
      <div className="py-2 flex-shrink-0 border-b">
        <input
          type="text"
          placeholder="Search stories (e.g., login, cart, admin)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="flex-grow overflow-y-auto pt-2">
        {filteredStories.length > 0 ? (
          filteredStories.map((story) => (
            <UserStoryCard
              key={story.id}
              story={story}
              onImageClick={handleImageClick} 
            />
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center mt-4">
            No stories match your search.
          </p>
        )}
      </div>
      {isViewerOpen && selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeViewer} 
        >
          <div
            className="relative p-4 bg-white rounded-lg max-w-3xl max-h-[80vh]"
            onClick={(e) => e.stopPropagation()} 
          >
            <button
              onClick={closeViewer}
              className="absolute top-2 right-2 text-black bg-white rounded-full p-1 text-xl leading-none hover:bg-gray-200"
              aria-label="Close image viewer"
            >
              &times;
            </button>
            <img
              src={selectedImage}
              alt="Selected story"
              className="max-w-full max-h-[calc(80vh-2rem)] object-contain" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStoriesSidebar;
