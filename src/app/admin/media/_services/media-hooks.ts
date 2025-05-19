import { ALLOWED_ADMIN_UPLOAD_TYPES } from '@/config/constants';
import { queryKeys } from '@/config/queryKeys';
import { Media } from '@prisma/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { generateRandomKey } from '@/lib/crypto';
import { SortOrder } from '@/lib/schema';

import mediaActions from './media-actions';

const apiUrl = process.env.NEXT_PUBLIC_BASE_URL;

type UploadFile = {
  id: string;
  file: File;
  error?: string;
  isUploaded?: boolean;
};

export const useUploadFiles = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const controller = useRef<AbortController>(null);

  const addFiles = (files: File[]) => {
    const filteredFiles = files.filter((file) => {
      const ext = file.name.split('.').pop();
      if (!ALLOWED_ADMIN_UPLOAD_TYPES.find((type) => file.type.startsWith(type) || type === ext)) {
        toast.error('File type not allowed .' + ext);

        return false;
      }

      return true;
    });
    const newFiles = filteredFiles.map((file) => ({
      id: generateRandomKey(16),
      file,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const uploadFile = async (item: UploadFile) => {
    const formData = new FormData();
    formData.append('file', item.file);
    setUploading(true);
    setProgress(0);
    controller.current = new AbortController();

    try {
      await axios.post(`${apiUrl}/api/media`, formData, {
        signal: controller.current?.signal,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent?.total || 1),
          );
          setProgress(percentCompleted);
        },
      });

      setProgress(0);
      setFiles((prev) =>
        prev.map((file) => (file.id === item.id ? { ...file, isUploaded: true } : file)),
      );
      queryClient.invalidateQueries({ queryKey: [queryKeys.media] });
    } catch (err: any) {
      const error = err.response?.data?.message || 'An error occurred';
      setFiles((prev) => prev.map((file) => (file.id === item.id ? { ...file, error } : file)));
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = (id: string) => {
    if (uploadingId === id) {
      controller.current?.abort();
      setUploading(false);
      setProgress(0);
      setUploadingId(null);
    }
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  useEffect(() => {
    if (files.length > 0 && !isUploading) {
      const file = files.find((file) => !file.isUploaded && !file.error);
      if (file) {
        setUploadingId(file.id);
        uploadFile(file);
      }
    }
  }, [files.length, isUploading]);

  return {
    files,
    addFiles,
    cancelUpload,
    progress,
    isUploading,
    uploadingId,
  };
};

export const useMediaTable = () => {
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [preview, setPreview] = useState<Media | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 15,
    sort: undefined as string | undefined,
    order: undefined as SortOrder,
    search: '',
  });
  const queryClient = useQueryClient();

  const setFilter = (filter: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, page: 1, ...filter }));
  };

  const deleteMedia = useMutation({
    mutationFn: mediaActions.deleteMedia,
    mutationKey: [queryKeys.media],
    onSuccess() {
      setSelected([]);
      setShowDeleteDialog(false);
      toast.success('Media deleted successfully');
      queryClient.invalidateQueries({ queryKey: [queryKeys.media] });
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const { data, isFetching } = useQuery({
    queryKey: [queryKeys.media, filters],
    queryFn: () =>
      mediaActions.queryMedia({
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        order: filters.order,
        ...(filters.search && { search: filters.search }),
      }),
  });

  useEffect(() => {
    setSelected([]);
  }, [filters]);

  return {
    filters,
    setFilter,
    data,
    isFetching,
    selected,
    setSelected,
    preview,
    setPreview,
    showDeleteDialog,
    setShowDeleteDialog,
    deleteMedia,
    openUploadDialog,
    setOpenUploadDialog,
    openPreviewDialog,
    setOpenPreviewDialog,
  };
};
