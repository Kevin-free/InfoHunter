import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useState, useEffect } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  const [inputPage, setInputPage] = useState(currentPage.toString());

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(inputPage);
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    } else {
      setInputPage(currentPage.toString());
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* 分页控制 */}
      <div className="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          {'<<'}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          {'<'}
        </Button>
        <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            className="w-14 h-8 text-center px-1"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            of {totalPages}
          </span>
        </form>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          {'>'}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          {'>>'}
        </Button>
      </div>

      {/* 每页显示数量选择 */}
      <Select
        value={pageSize.toString()}
        onValueChange={(value) => onPageSizeChange(parseInt(value))}
      >
        <SelectTrigger className="h-8 w-[130px] order-1 sm:order-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[10, 20, 30, 50].map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size} per page
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
