package com.ths.onlinefood.repository;

import com.ths.onlinefood.model.TinNhan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TinNhanRepository extends JpaRepository<TinNhan, Long> {
    List<TinNhan> findByHoiThoaiIdOrderByThoiGianTaoAsc(Long hoiThoaiId);
}