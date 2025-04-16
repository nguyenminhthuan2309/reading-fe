"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";

// Available genre options for selection
const genreOptions = [
  { label: "Adventure", value: "Adventure" }, // Phiêu lưu
  { label: "Comedy", value: "Comedy" }, // Hài hước
  { label: "Drama", value: "Drama" }, // Chính kịch
  { label: "Fantasy", value: "Fantasy" }, // Giả tưởng
  { label: "Historical", value: "Historical" }, // Lịch sử
  { label: "Horror", value: "Horror" }, // Kinh dị
  { label: "Mystery", value: "Mystery" }, // Bí ẩn
  { label: "Romance", value: "Romance" }, // Lãng mạn
  { label: "Sci-fi", value: "Sci-fi" }, // Khoa học viễn tưởng
  { label: "Slice of Life", value: "Slice of Life" }, // Đời thường
  { label: "Thriller", value: "Thriller" }, // Gay cấn
  { label: "Tragedy", value: "Tragedy" }, // Bi kịch
  { label: "Crime", value: "Crime" }, // Tội phạm
  { label: "Supernatural", value: "Supernatural" }, // Siêu nhiên
  { label: "Psychological", value: "Psychological" }, // Tâm lý
  { label: "Martial Arts", value: "Martial Arts" }, // Võ thuật
  { label: "Post-Apocalyptic", value: "Post-Apocalyptic" }, // Hậu tận thế
  { label: "Survival", value: "Survival" }, // Sinh tồn
  { label: "Reincarnation", value: "Reincarnation" }, // Luân hồi
  { label: "Time Travel", value: "Time Travel" }, // Du hành thời gian
  { label: "Steampunk", value: "Steampunk" }, // Steampunk
  { label: "Cyberpunk", value: "Cyberpunk" }, // Cyberpunk
  { label: "Magic", value: "Magic" }, // Ma thuật
  { label: "Military", value: "Military" }, // Quân sự
  { label: "Philosophical", value: "Philosophical" }, // Triết lý
  { label: "Wuxia", value: "Wuxia" }, // Võ hiệp (Wuxia)
  { label: "Xianxia", value: "Xianxia" }, // Tiên hiệp (Xianxia)
  { label: "Xuanhuan", value: "Xuanhuan" }, // Huyền huyễn (Xuanhuan)
  { label: "Sports", value: "Sports" }, // Thể thao
  { label: "Mecha", value: "Mecha" }, // Robot khổng lồ (Mecha)
  { label: "Vampires", value: "Vampires" }, // Ma cà rồng
  { label: "Zombies", value: "Zombies" }, // Xác sống
  { label: "Detective", value: "Detective" }, // Trinh thám
  { label: "School Life", value: "School Life" }, // Học đường
  { label: "Medical", value: "Medical" }, // Y khoa
  { label: "Music", value: "Music" }, // Âm nhạc
  { label: "Cooking", value: "Cooking" }, // Ẩm thực
  { label: "Game", value: "Game" }, // Trò chơi
  { label: "Virtual Reality", value: "Virtual Reality" }, // Thực tế ảo
  { label: "Politics", value: "Politics" }, // Chính trị
  { label: "Science", value: "Science" } // Khoa học
];

// Profile edit dialog props
interface EditProfileDialogProps {
  userData: {
    name: string;
    username: string;
    email: string;
    bio?: string;
    preferences: {
      favorites: string[];
      readingSpeed: string;
      theme: string;
    };
  };
  onSave: (updatedData: any) => void;
}

export function EditProfileDialog({ userData, onSave }: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    name: userData.name,
    username: userData.username,
    email: userData.email,
    bio: userData.bio || "",
    favorites: userData.preferences.favorites,
    readingSpeed: userData.preferences.readingSpeed,
    theme: userData.preferences.theme,
  });
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Format data for saving
      const updatedData = {
        ...userData,
        name: formData.name,
        username: formData.username,
        email: formData.email,
        bio: formData.bio,
        preferences: {
          ...userData.preferences,
          favorites: formData.favorites,
          readingSpeed: formData.readingSpeed,
          theme: formData.theme,
        }
      };
      
      // Call the save function
      onSave(updatedData);
      setOpen(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings size={16} />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Favorite Genres</Label>
              <MultiSelect
                options={genreOptions}
                selected={formData.favorites}
                onChange={(selected: string[]) => handleChange("favorites", selected)}
                placeholder="Select genres..."
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="readingSpeed">Reading Speed</Label>
                <select
                  id="readingSpeed"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.readingSpeed}
                  onChange={(e) => handleChange("readingSpeed", e.target.value)}
                >
                  <option value="Slow">Slow</option>
                  <option value="Medium">Medium</option>
                  <option value="Fast">Fast</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme">Theme Preference</Label>
                <select
                  id="theme"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.theme}
                  onChange={(e) => handleChange("theme", e.target.value)}
                >
                  <option value="Dark">Dark</option>
                  <option value="Light">Light</option>
                  <option value="System">System</option>
                </select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 